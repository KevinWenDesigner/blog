import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { parseAutomationConfig } from '../src/lib/autoblog/config';
import {
  matchChannelEntry,
  parseYtDlpDiscoveryLines,
  parseYoutubeFeed,
  resolveCategory,
  type ChannelConfig,
  type FeedEntry
} from '../src/lib/autoblog/discovery';
import { generateArticleWithOpenAI } from '../src/lib/autoblog/openai';
import {
  buildAutoblogMarkdown,
  buildAutoblogSlug,
  extractExistingVideoIds
} from '../src/lib/autoblog/render';
import { normalizeSubtitleTranscript, selectSubtitleTrack, transcriptLooksUsable } from '../src/lib/autoblog/transcript';

type CandidateResult = {
  videoId: string;
  title: string;
  channel: string;
  url: string;
  outputPath?: string;
  reason?: string;
  details?: string;
};

type RunReport = {
  startedAt: string;
  finishedAt?: string;
  dryRun: boolean;
  matchedCandidates: number;
  published: CandidateResult[];
  skipped: CandidateResult[];
  failed: CandidateResult[];
};

type YtDlpMetadata = {
  id: string;
  title: string;
  description?: string;
  channel?: string;
  channel_id?: string;
  thumbnail?: string;
  upload_date?: string;
  timestamp?: number;
  webpage_url?: string;
  subtitles?: Record<string, Array<{ ext?: string; url: string }>>;
  automatic_captions?: Record<string, Array<{ ext?: string; url: string }>>;
};

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const contentDir = resolve(repoRoot, 'src/content/blog');
const reportDir = resolve(repoRoot, '.autoblog');
const previewDir = resolve(reportDir, 'generated-posts');
const reportPath = resolve(reportDir, 'autoblog-report.json');
const summaryPath = resolve(reportDir, 'summary.md');

function isTruthy(value: string | undefined): boolean {
  return value === '1' || value === 'true' || value === 'yes';
}

function normalizeIsoDate(input: string): string {
  return input.slice(0, 10);
}

function normalizeYtDlpPublishedAt(
  input: Pick<YtDlpMetadata, 'upload_date' | 'timestamp'> | null | undefined
): string | undefined {
  if (typeof input?.timestamp === 'number' && Number.isFinite(input.timestamp)) {
    return new Date(input.timestamp * 1000).toISOString();
  }

  const compactDate = input?.upload_date?.trim() ?? '';
  if (/^\d{8}$/.test(compactDate)) {
    const year = compactDate.slice(0, 4);
    const month = compactDate.slice(4, 6);
    const day = compactDate.slice(6, 8);
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  return undefined;
}

function dateSortValue(input: string): number {
  const parsed = Date.parse(input);
  return Number.isFinite(parsed) ? parsed : 0;
}

function shouldUseYtDlpDiscoveryFallback(error: unknown): boolean {
  return error instanceof Error && /:\s*404\b/.test(error.message);
}

async function readMarkdownContents(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        return readMarkdownContents(entryPath);
      }

      if (!entry.isFile() || !entry.name.endsWith('.md')) {
        return [];
      }

      return [await readFile(entryPath, 'utf8')];
    })
  );

  return files.flat();
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'blog-impl-autoblog'
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return response.text();
}

async function loadChannelEntriesFromFeed(channel: ChannelConfig): Promise<FeedEntry[]> {
  const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`);
  return parseYoutubeFeed(xml)
    .filter((entry) => entry.channelId === channel.channelId)
    .filter((entry) => matchChannelEntry(entry, channel));
}

async function loadChannelEntriesWithYtDlp(channel: ChannelConfig, limit: number): Promise<FeedEntry[]> {
  const { stdout } = await execFileAsync(
    'yt-dlp',
    [
      '--dump-json',
      '--skip-download',
      '--flat-playlist',
      '--no-warnings',
      '--playlist-end',
      String(limit),
      `https://www.youtube.com/channel/${channel.channelId}/videos`
    ],
    {
      cwd: repoRoot,
      maxBuffer: 50 * 1024 * 1024
    }
  );

  const discoveredAt = Date.now();
  return parseYtDlpDiscoveryLines(stdout, channel)
    .map((entry, index) => {
      if (entry.publishedAt) {
        return entry;
      }

      const syntheticPublishedAt = new Date(discoveredAt - index * 1000).toISOString();
      return {
        ...entry,
        publishedAt: syntheticPublishedAt,
        updatedAt: syntheticPublishedAt
      };
    })
    .filter((entry) => matchChannelEntry(entry, channel));
}

async function loadChannelEntries(channel: ChannelConfig, limit: number): Promise<FeedEntry[]> {
  try {
    return await loadChannelEntriesFromFeed(channel);
  } catch (error) {
    if (!shouldUseYtDlpDiscoveryFallback(error)) {
      throw error;
    }

    return loadChannelEntriesWithYtDlp(channel, limit);
  }
}

async function readVideoMetadata(url: string): Promise<YtDlpMetadata> {
  const { stdout } = await execFileAsync(
    'yt-dlp',
    ['--dump-single-json', '--skip-download', '--no-warnings', url],
    {
      cwd: repoRoot,
      maxBuffer: 20 * 1024 * 1024
    }
  );

  return JSON.parse(stdout) as YtDlpMetadata;
}

async function ensureDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

function buildSummaryMarkdown(report: RunReport): string {
  const formatRow = (item: CandidateResult): string =>
    `| ${item.videoId} | ${item.channel} | ${item.title.replace(/\|/g, '\\|')} | ${item.reason ?? item.outputPath ?? '-'} |`;

  const sections = [
    '# Autoblog Report',
    '',
    `- 开始时间：${report.startedAt}`,
    `- 结束时间：${report.finishedAt ?? '-'}`,
    `- dry run：${report.dryRun ? 'true' : 'false'}`,
    `- 匹配候选：${report.matchedCandidates}`,
    `- 已生成：${report.published.length}`,
    `- 已跳过：${report.skipped.length}`,
    `- 失败：${report.failed.length}`,
    ''
  ];

  for (const [title, items] of [
    ['已生成', report.published],
    ['已跳过', report.skipped],
    ['失败', report.failed]
  ] as const) {
    sections.push(`## ${title}`, '', '| videoId | channel | title | result |', '| --- | --- | --- | --- |');
    sections.push(...(items.length > 0 ? items.map(formatRow) : ['| - | - | - | - |']));
    sections.push('');
  }

  return sections.join('\n');
}

async function main(): Promise<void> {
  const dryRun = isTruthy(process.env.AUTOBLOG_DRY_RUN);
  const maxVideos = Number.parseInt(process.env.AUTOBLOG_MAX_VIDEOS ?? '3', 10);
  const openAiKey = process.env.OPENAI_API_KEY;
  const model = process.env.AUTOBLOG_OPENAI_MODEL;
  const configPath = resolve(repoRoot, process.env.AUTOBLOG_CONFIG_PATH ?? 'automation/channels.json');

  await ensureDirectory(reportDir);
  await ensureDirectory(previewDir);

  const report: RunReport = {
    startedAt: new Date().toISOString(),
    dryRun,
    matchedCandidates: 0,
    published: [],
    skipped: [],
    failed: []
  };

  try {
    const config = parseAutomationConfig(await readFile(configPath, 'utf8'));
    if (config.channels.length === 0) {
      return;
    }

    if (!openAiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const existingVideoIds = extractExistingVideoIds(await readMarkdownContents(contentDir));
    const discoveryLookahead = Number.isFinite(maxVideos) ? Math.max(maxVideos * 3, 10) : 10;
    const channelEntries = await Promise.all(
      config.channels.map((channel) => loadChannelEntries(channel, discoveryLookahead))
    );
    const flattened = channelEntries
      .flat()
      .sort((a, b) => dateSortValue(b.publishedAt) - dateSortValue(a.publishedAt));

    const seenVideoIds = new Set<string>(existingVideoIds);
    const queue: Array<{ channel: ChannelConfig; entry: FeedEntry }> = [];

    for (const entry of flattened) {
      if (seenVideoIds.has(entry.videoId)) {
        report.skipped.push({
          videoId: entry.videoId,
          title: entry.title,
          channel: entry.channelName,
          url: entry.url,
          reason: 'duplicate-video'
        });
        continue;
      }

      const channel = config.channels.find((candidate) => candidate.channelId === entry.channelId);
      if (!channel) {
        continue;
      }

      seenVideoIds.add(entry.videoId);
      queue.push({ channel, entry });
      if (Number.isFinite(maxVideos) && queue.length >= maxVideos) {
        break;
      }
    }

    report.matchedCandidates = queue.length;

    for (const item of queue) {
      try {
        const metadata = await readVideoMetadata(item.entry.url);
        const subtitle = selectSubtitleTrack(metadata);
        if (!subtitle) {
          report.skipped.push({
            videoId: item.entry.videoId,
            title: item.entry.title,
            channel: item.entry.channelName,
            url: item.entry.url,
            reason: 'missing-subtitles'
          });
          continue;
        }

        const rawSubtitle = await fetchText(subtitle.url);
        const transcript = normalizeSubtitleTranscript(rawSubtitle, subtitle.ext);
        if (!transcriptLooksUsable(transcript)) {
          report.skipped.push({
            videoId: item.entry.videoId,
            title: item.entry.title,
            channel: item.entry.channelName,
            url: item.entry.url,
            reason: 'subtitle-too-short'
          });
          continue;
        }

        let article = null;
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          try {
            article = await generateArticleWithOpenAI({
              apiKey: openAiKey,
              model,
              metadata: {
                title: metadata.title,
                description: metadata.description ?? item.entry.description,
                channel: metadata.channel ?? item.entry.channelName,
                url: item.entry.url
              },
              transcript
            });
            break;
          } catch (error) {
            lastError = error;
          }
        }

        if (!article) {
          throw lastError instanceof Error ? lastError : new Error('OpenAI generation failed');
        }

        const category = resolveCategory(
          `${item.entry.title}\n${item.entry.description}\n${metadata.description ?? ''}`,
          item.channel.defaultCategory,
          config.categoryRules
        );
        const slug = buildAutoblogSlug(article.title, item.entry.videoId);
        const relativePath = dryRun ? `.autoblog/generated-posts/${slug}.md` : `src/content/blog/${slug}.md`;
        const absolutePath = resolve(repoRoot, relativePath);
        const markdown = buildAutoblogMarkdown({
          fileDate: normalizeIsoDate(new Date().toISOString()),
          category,
          defaultTags: item.channel.defaultTags,
          article,
          source: {
            platform: 'youtube',
            videoId: item.entry.videoId,
            url: item.entry.url,
            channel: metadata.channel ?? item.entry.channelName,
            originalTitle: metadata.title,
            publishedAt:
              normalizeYtDlpPublishedAt(metadata) || item.entry.publishedAt || new Date().toISOString(),
            thumbnail: metadata.thumbnail
          }
        });

        await ensureDirectory(dirname(absolutePath));
        await writeFile(absolutePath, markdown, 'utf8');

        if (!dryRun) {
          await writeFile(resolve(previewDir, `${slug}.md`), markdown, 'utf8');
        }

        report.published.push({
          videoId: item.entry.videoId,
          title: article.title,
          channel: metadata.channel ?? item.entry.channelName,
          url: item.entry.url,
          outputPath: relativePath
        });
      } catch (error) {
        report.failed.push({
          videoId: item.entry.videoId,
          title: item.entry.title,
          channel: item.entry.channelName,
          url: item.entry.url,
          reason: 'processing-error',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  } finally {
    report.finishedAt = new Date().toISOString();
    await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    await writeFile(summaryPath, buildSummaryMarkdown(report), 'utf8');
  }
}

main().catch(async (error) => {
  await ensureDirectory(reportDir);
  const message = error instanceof Error ? error.message : String(error);
  const report = {
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    dryRun: isTruthy(process.env.AUTOBLOG_DRY_RUN),
    matchedCandidates: 0,
    published: [],
    skipped: [],
    failed: [{ videoId: '-', title: 'startup', channel: '-', url: '-', reason: 'fatal', details: message }]
  } satisfies RunReport;
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  await writeFile(summaryPath, buildSummaryMarkdown(report), 'utf8');
  console.error(message);
  process.exitCode = 1;
});
