import { describe, expect, it } from 'vitest';

import { normalizeGeneratedArticle } from './openai';

describe('autoblog OpenAI normalization', () => {
  it('accepts a valid structured article and trims noisy values', () => {
    const article = normalizeGeneratedArticle({
      title: ' OpenAI Agents in Production ',
      description: ' 一篇面向工程实践的自动摘要。 ',
      tags: ['Automation', 'Automation', ' Agents '],
      keywords: ['OpenAI', 'workflow', 'OpenAI'],
      summary: ' 这期视频集中讲了 agent pipeline 的上线方式，包括拆解步骤、日志回放和自动发布的边界控制。 ',
      keyPoints: [
        { heading: '拆解流程', detail: '先锁输入输出，再让模型接入固定接口。', timestamp: '00:15' },
        { heading: '补齐日志', detail: '优先做回放和错误定位，而不是先堆能力。', timestamp: '04:20' },
        { heading: '接入 CI', detail: '把发布动作放进可重复的流水线里执行。' }
      ],
      notableDetails: [' 展示了一份上线清单 '],
      actionAdvice: [' 从单频道白名单开始 ']
    });

    expect(article.tags).toEqual(['Automation', 'Agents']);
    expect(article.keywords).toEqual(['OpenAI', 'workflow']);
    expect(article.summary).toBe('这期视频集中讲了 agent pipeline 的上线方式，包括拆解步骤、日志回放和自动发布的边界控制。');
  });

  it('rejects incomplete payloads instead of emitting broken markdown', () => {
    expect(() =>
      normalizeGeneratedArticle({
        title: 'Broken article',
        description: 'missing sections'
      })
    ).toThrow(/tags|keyPoints/i);
  });
});
