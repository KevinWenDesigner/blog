export type GeneratedArticle = {
  title: string;
  description: string;
  tags: string[];
  keywords: string[];
  summary: string;
  keyPoints: Array<{
    heading: string;
    detail: string;
    timestamp?: string;
  }>;
  notableDetails: string[];
  actionAdvice: string[];
};

export type YoutubeSource = {
  platform: 'youtube';
  videoId: string;
  url: string;
  channel: string;
  originalTitle: string;
  publishedAt: string;
  thumbnail?: string;
};

type BuildAutoblogMarkdownInput = {
  fileDate: string;
  category: string;
  defaultTags: string[];
  article: GeneratedArticle;
  source: YoutubeSource;
};

function escapeFrontmatterValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

function yamlScalar(value: string): string {
  return `"${escapeFrontmatterValue(value)}"`;
}

function listBlock(values: string[], indent = '  '): string {
  if (values.length === 0) {
    return `${indent}[]`;
  }

  return values.map((value) => `${indent}- ${yamlScalar(value)}`).join('\n');
}

function dedupeValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function extractExistingVideoIds(contents: string[]): Set<string> {
  return new Set(
    contents
      .map((content) => content.match(/^[ \t]*videoId:\s*(.+)$/m)?.[1]?.trim())
      .filter((value): value is string => Boolean(value))
  );
}

export function buildAutoblogSlug(title: string, videoId: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');

  if (!normalized) {
    return `youtube-${videoId}`;
  }

  return `${normalized}-${videoId}`;
}

export function buildAutoblogMarkdown({
  fileDate,
  category,
  defaultTags,
  article,
  source
}: BuildAutoblogMarkdownInput): string {
  const tags = dedupeValues([...defaultTags, ...article.tags]);
  const keywords = dedupeValues(article.keywords);
  const keyPointSection = article.keyPoints
    .map((point) => {
      const heading = point.timestamp ? `${point.heading}（${point.timestamp}）` : point.heading;
      return `### ${heading}\n${point.detail}`;
    })
    .join('\n\n');

  const detailItems = article.notableDetails.map((detail) => `- ${detail}`).join('\n');
  const actionItems = article.actionAdvice.map((detail) => `- ${detail}`).join('\n');

  return `---
title: "${escapeFrontmatterValue(article.title)}"
description: "${escapeFrontmatterValue(article.description)}"
pubDate: ${fileDate}
updatedDate: ${fileDate}
category: ${yamlScalar(category)}
tags:
${listBlock(tags)}
keywords:
${listBlock(keywords)}
draft: false
comments: true
source:
  platform: youtube
  videoId: ${yamlScalar(source.videoId)}
  url: ${yamlScalar(source.url)}
  channel: ${yamlScalar(source.channel)}
  originalTitle: ${yamlScalar(source.originalTitle)}
  publishedAt: ${yamlScalar(source.publishedAt)}
${source.thumbnail ? `  thumbnail: ${yamlScalar(source.thumbnail)}\n` : ''}---

> 来源说明：本文由自动化流程基于公开视频字幕生成，适合快速浏览要点，建议结合原视频交叉阅读。

## 这期视频讲什么

${article.summary}

## 3-5 个核心观点

${keyPointSection}

## 值得保留的细节/案例

${detailItems}

## 适用场景/行动建议

${actionItems}

## 原视频

- 平台：YouTube
- 频道：${source.channel}
- 标题：[${source.originalTitle}](${source.url})
- 发布时间：${source.publishedAt}
`;
}
