import { describe, expect, it } from 'vitest';

import {
  matchChannelEntry,
  parseYtDlpDiscoveryLines,
  parseYoutubeFeed,
  resolveCategory,
  shouldUseYtDlpDiscoveryFallback,
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

  it('parses yt-dlp discovery lines when the YouTube feed is unavailable', () => {
    const lines = [
      JSON.stringify({
        id: '77dNa9uscTM',
        title: 'Google 把 AI 搜索塞进 Windows！完全免费，比传统搜索强太多了（实测体验）| 零度解说',
        description: 'AI 搜索和 Windows 集成实测。',
        upload_date: '20260418',
        webpage_url: 'https://www.youtube.com/watch?v=77dNa9uscTM'
      }),
      JSON.stringify({
        id: 'vsm1oVl_pzE',
        title: '5分钟搭建AI助手！自动接单+自动回复，小白也能用',
        description: 'Hostinger 自动化工作流。',
        timestamp: 1776428109,
        channel: '零度解说',
        channel_id: 'UCvijahEyGtvMpmMHBu4FS2w',
        webpage_url: 'https://www.youtube.com/watch?v=vsm1oVl_pzE'
      })
    ].join('\n');

    expect(parseYtDlpDiscoveryLines(lines, channel)).toEqual([
      {
        videoId: '77dNa9uscTM',
        channelId: 'UC123',
        title: 'Google 把 AI 搜索塞进 Windows！完全免费，比传统搜索强太多了（实测体验）| 零度解说',
        description: 'AI 搜索和 Windows 集成实测。',
        publishedAt: '2026-04-18T00:00:00.000Z',
        updatedAt: '2026-04-18T00:00:00.000Z',
        channelName: 'AI Notes',
        url: 'https://www.youtube.com/watch?v=77dNa9uscTM'
      },
      {
        videoId: 'vsm1oVl_pzE',
        channelId: 'UCvijahEyGtvMpmMHBu4FS2w',
        title: '5分钟搭建AI助手！自动接单+自动回复，小白也能用',
        description: 'Hostinger 自动化工作流。',
        publishedAt: '2026-04-17T12:15:09.000Z',
        updatedAt: '2026-04-17T12:15:09.000Z',
        channelName: '零度解说',
        url: 'https://www.youtube.com/watch?v=vsm1oVl_pzE'
      }
    ]);
  });

  it('maps categories from keyword rules and falls back to the channel default', () => {
    const rules: CategoryRule[] = [
      { category: '工程化', keywords: ['workflow', 'pipeline', 'deploy'] },
      { category: '教程', keywords: ['guide', 'walkthrough'] }
    ];

    expect(resolveCategory('Production workflow guide', channel.defaultCategory, rules)).toBe('工程化');
    expect(resolveCategory('Undocumented release tricks', channel.defaultCategory, rules)).toBe('读书');
  });

  it('falls back to yt-dlp for missing, throttled, or transient YouTube feed failures', () => {
    expect(
      shouldUseYtDlpDiscoveryFallback(
        new Error('Request failed for https://www.youtube.com/feeds/videos.xml?channel_id=UC123: 404')
      )
    ).toBe(true);
    expect(
      shouldUseYtDlpDiscoveryFallback(
        new Error('Request failed for https://www.youtube.com/feeds/videos.xml?channel_id=UC123: 429')
      )
    ).toBe(true);
    expect(
      shouldUseYtDlpDiscoveryFallback(
        new Error('Request failed for https://www.youtube.com/feeds/videos.xml?channel_id=UC123: 500')
      )
    ).toBe(true);
    expect(shouldUseYtDlpDiscoveryFallback(new TypeError('fetch failed'))).toBe(true);
    expect(
      shouldUseYtDlpDiscoveryFallback(
        new Error('Request failed for https://www.youtube.com/feeds/videos.xml?channel_id=UC123: 403')
      )
    ).toBe(false);
    expect(shouldUseYtDlpDiscoveryFallback('not an error')).toBe(false);
  });
});
