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
