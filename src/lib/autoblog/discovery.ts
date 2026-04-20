export type ChannelConfig = {
  channelId: string;
  label: string;
  defaultCategory: string;
  includeKeywords: string[];
  excludeKeywords: string[];
  defaultTags: string[];
};

export type CategoryRule = {
  category: string;
  keywords: string[];
};

export type FeedEntry = {
  videoId: string;
  channelId: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  channelName: string;
  url: string;
};

type YtDlpDiscoveryEntry = {
  id?: string;
  title?: string;
  description?: string;
  upload_date?: string | null;
  timestamp?: number | null;
  channel?: string | null;
  channel_id?: string | null;
  webpage_url?: string | null;
};

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTagValue(xml: string, tagName: string): string {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i'));
  return decodeXml(match?.[1]?.trim() ?? '');
}

function normalizeDiscoveryDate(entry: YtDlpDiscoveryEntry): string {
  if (typeof entry.timestamp === 'number' && Number.isFinite(entry.timestamp)) {
    return new Date(entry.timestamp * 1000).toISOString();
  }

  const compactDate = entry.upload_date?.trim() ?? '';
  if (/^\d{8}$/.test(compactDate)) {
    const year = compactDate.slice(0, 4);
    const month = compactDate.slice(4, 6);
    const day = compactDate.slice(6, 8);
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  return '';
}

export function parseYoutubeFeed(feedXml: string): FeedEntry[] {
  const entryMatches = [...feedXml.matchAll(/<entry\b[\s\S]*?>([\s\S]*?)<\/entry>/gi)];

  return entryMatches
    .map((match) => match[1] ?? '')
    .map((entryXml) => {
      const videoId = extractTagValue(entryXml, 'yt:videoId');
      if (!videoId) {
        return null;
      }

      return {
        videoId,
        channelId: extractTagValue(entryXml, 'yt:channelId'),
        title: extractTagValue(entryXml, 'title'),
        description: extractTagValue(entryXml, 'media:description'),
        publishedAt: extractTagValue(entryXml, 'published'),
        updatedAt: extractTagValue(entryXml, 'updated'),
        channelName: extractTagValue(entryXml, 'name'),
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    })
    .filter((entry): entry is FeedEntry => entry !== null);
}

export function parseYtDlpDiscoveryLines(
  jsonLines: string,
  fallbackChannel: Pick<ChannelConfig, 'channelId' | 'label'>
): FeedEntry[] {
  return jsonLines
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as YtDlpDiscoveryEntry)
    .map((entry) => {
      const videoId = entry.id?.trim() ?? '';
      if (!videoId) {
        return null;
      }

      const publishedAt = normalizeDiscoveryDate(entry);

      return {
        videoId,
        channelId: entry.channel_id?.trim() || fallbackChannel.channelId,
        title: entry.title?.trim() ?? '',
        description: entry.description?.trim() ?? '',
        publishedAt,
        updatedAt: publishedAt,
        channelName: entry.channel?.trim() || fallbackChannel.label,
        url: entry.webpage_url?.trim() || `https://www.youtube.com/watch?v=${videoId}`
      };
    })
    .filter((entry): entry is FeedEntry => entry !== null);
}

function includesKeyword(text: string, keywords: string[]): boolean {
  if (keywords.length === 0) {
    return true;
  }

  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.trim().toLowerCase()));
}

export function matchChannelEntry(entry: FeedEntry, channel: ChannelConfig): boolean {
  const haystack = `${entry.title}\n${entry.description}`.toLowerCase();
  const hasIncludeMatch = includesKeyword(haystack, channel.includeKeywords);
  const hasExcludeMatch = channel.excludeKeywords.some((keyword) =>
    haystack.includes(keyword.trim().toLowerCase())
  );

  return hasIncludeMatch && !hasExcludeMatch;
}

export function resolveCategory(text: string, defaultCategory: string, rules: CategoryRule[]): string {
  const normalized = text.toLowerCase();
  const matched = rules.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword.trim().toLowerCase()))
  );

  return matched?.category ?? defaultCategory;
}
