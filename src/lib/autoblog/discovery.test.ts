import { describe, expect, it } from 'vitest';

import {
  matchChannelEntry,
  parseYoutubeFeed,
  resolveCategory,
  type ChannelConfig,
  type CategoryRule
} from './discovery';

const channel: ChannelConfig = {
  channelId: 'UC123',
  label: 'AI Notes',
  defaultCategory: '读书',
  includeKeywords: ['openai', 'agent'],
  excludeKeywords: ['podcast'],
  defaultTags: ['AI', 'YouTube']
};

describe('autoblog discovery', () => {
  it('parses the YouTube channel feed into candidate entries', () => {
    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <entry>
    <yt:videoId>abc123xyz99</yt:videoId>
    <yt:channelId>UC123</yt:channelId>
    <title>OpenAI Agents in Production</title>
    <published>2026-04-20T02:00:00+00:00</published>
    <updated>2026-04-20T03:00:00+00:00</updated>
    <author>
      <name>AI Notes</name>
    </author>
    <media:group>
      <media:description>A walkthrough for agent pipelines.</media:description>
    </media:group>
  </entry>
</feed>`;

    expect(parseYoutubeFeed(feed)).toEqual([
      {
        videoId: 'abc123xyz99',
        channelId: 'UC123',
        title: 'OpenAI Agents in Production',
        description: 'A walkthrough for agent pipelines.',
        publishedAt: '2026-04-20T02:00:00+00:00',
        updatedAt: '2026-04-20T03:00:00+00:00',
        channelName: 'AI Notes',
        url: 'https://www.youtube.com/watch?v=abc123xyz99'
      }
    ]);
  });

  it('matches entries by include/exclude keywords', () => {
    expect(
      matchChannelEntry(
        {
          videoId: 'abc123xyz99',
          channelId: 'UC123',
          title: 'OpenAI agent workflow teardown',
          description: 'Practical release checklist',
          publishedAt: '2026-04-20T02:00:00+00:00',
          updatedAt: '2026-04-20T03:00:00+00:00',
          channelName: 'AI Notes',
          url: 'https://www.youtube.com/watch?v=abc123xyz99'
        },
        channel
      )
    ).toBe(true);

    expect(
      matchChannelEntry(
        {
          videoId: 'def456uvw88',
          channelId: 'UC123',
          title: 'Weekly podcast roundup',
          description: 'OpenAI news and commentary',
          publishedAt: '2026-04-20T02:00:00+00:00',
          updatedAt: '2026-04-20T03:00:00+00:00',
          channelName: 'AI Notes',
          url: 'https://www.youtube.com/watch?v=def456uvw88'
        },
        channel
      )
    ).toBe(false);
  });

  it('maps categories from keyword rules and falls back to the channel default', () => {
    const rules: CategoryRule[] = [
      { category: '工程化', keywords: ['workflow', 'pipeline', 'deploy'] },
      { category: '教程', keywords: ['guide', 'walkthrough'] }
    ];

    expect(resolveCategory('Production workflow guide', channel.defaultCategory, rules)).toBe('工程化');
    expect(resolveCategory('Undocumented release tricks', channel.defaultCategory, rules)).toBe('读书');
  });
});
