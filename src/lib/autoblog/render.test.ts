import { describe, expect, it } from 'vitest';

import {
  buildAutoblogMarkdown,
  buildAutoblogSlug,
  extractExistingVideoIds
} from './render';

describe('autoblog render helpers', () => {
  it('extracts existing YouTube source ids from generated markdown files', () => {
    const ids = extractExistingVideoIds([
      `---
title: Example
source:
  platform: youtube
  videoId: abc123xyz99
---
body`,
      `---
title: Manual post
---
body`
    ]);

    expect(ids).toEqual(new Set(['abc123xyz99']));
  });

  it('builds a stable slug that falls back when the title has no latin characters', () => {
    expect(buildAutoblogSlug('OpenAI Agents in Production', 'abc123xyz99')).toBe('openai-agents-in-production-abc123xyz99');
    expect(buildAutoblogSlug('纯中文标题', 'def456uvw88')).toBe('youtube-def456uvw88');
  });

  it('renders markdown with fixed sections and source metadata', () => {
    const markdown = buildAutoblogMarkdown({
      fileDate: '2026-04-20',
      category: '工程化',
      defaultTags: ['AI', 'YouTube'],
      article: {
        title: 'OpenAI Agents in Production',
        description: '一篇面向工程实践的自动摘要。',
        tags: ['Automation', 'Agents'],
        keywords: ['OpenAI', 'workflow'],
        summary: '这期视频集中讲了 agent pipeline 的上线方式。',
        keyPoints: [
          { heading: '把流程拆成稳定步骤', detail: '先锁输入输出，再接模型。', timestamp: '00:15' },
          { heading: '先做失败可见性', detail: '日志和回放比炫技更重要。', timestamp: '04:20' },
          { heading: '把发布链路放进 CI', detail: '减少手工操作，才能持续运行。' }
        ],
        notableDetails: ['作者展示了一个真实的发布清单。'],
        actionAdvice: ['先从单频道白名单开始，而不是全网抓取。']
      },
      source: {
        platform: 'youtube',
        videoId: 'abc123xyz99',
        url: 'https://www.youtube.com/watch?v=abc123xyz99',
        channel: 'AI Notes',
        originalTitle: 'OpenAI Agents in Production',
        publishedAt: '2026-04-19T10:00:00.000Z',
        thumbnail: 'https://i.ytimg.com/vi/abc123xyz99/maxresdefault.jpg'
      }
    });

    expect(markdown).toContain('category: "工程化"');
    expect(markdown).toContain('videoId: "abc123xyz99"');
    expect(markdown).toContain('## 这期视频讲什么');
    expect(markdown).toContain('## 3-5 个核心观点');
    expect(markdown).toContain('## 值得保留的细节/案例');
    expect(markdown).toContain('## 适用场景/行动建议');
    expect(markdown).toContain('## 原视频');
    expect(markdown).toContain('- 平台：YouTube');
  });

  it('marks articles generated from metadata when subtitles are unavailable', () => {
    const markdown = buildAutoblogMarkdown({
      fileDate: '2026-04-20',
      category: '教程',
      defaultTags: ['YouTube'],
      article: {
        title: 'Claude Code desktop walkthrough',
        description: '一篇基于视频描述生成的保守摘要。',
        tags: ['Claude Code'],
        keywords: ['desktop', 'Claude'],
        summary: '视频描述提到 Claude Code 桌面版新增了一些值得关注的功能。',
        keyPoints: [
          { heading: '桌面入口', detail: '描述重点是桌面应用的新功能。' },
          { heading: '使用边界', detail: '没有字幕时只能保守提炼描述中出现的信息。' },
          { heading: '原视频校验', detail: '关键细节仍然需要回到原视频确认。' }
        ],
        notableDetails: ['字幕不可用时不会伪装成字幕摘要。'],
        actionAdvice: ['先打开原视频确认功能演示。']
      },
      source: {
        platform: 'youtube',
        videoId: 'N9nU9oLZ30o',
        url: 'https://www.youtube.com/watch?v=N9nU9oLZ30o',
        channel: 'Academind',
        originalTitle: 'Key features of the NEW Claude Code desktop app you MUST know!',
        publishedAt: '2026-04-23T00:00:00.000Z',
        basis: 'metadata'
      }
    });

    expect(markdown).toContain('basis: "metadata"');
    expect(markdown).toContain('字幕不可用');
    expect(markdown).toContain('标题：[Key features of the NEW Claude Code desktop app you MUST know!]');
  });
});
