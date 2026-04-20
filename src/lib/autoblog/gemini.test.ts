import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateArticleWithGemini } from './gemini';

describe('autoblog Gemini generation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests a structured JSON article from Gemini and normalizes the result', async () => {
    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      title: 'Google AI Search on Windows',
                      description: '一篇面向 AI 搜索体验的自动摘要。',
                      tags: ['AI', 'Search'],
                      keywords: ['Google', 'AI', 'Windows'],
                      summary:
                        '这期视频围绕 Google 将 AI 搜索能力接入 Windows 的体验展开，重点说明安装方式、实际搜索效果和相对传统搜索的差异。',
                      keyPoints: [
                        { heading: '搜索入口', detail: 'AI 搜索被放到桌面流程里，减少了切换工具的成本。', timestamp: null },
                        { heading: '结果组织', detail: '结果更偏向总结和行动建议，而不是只给网页链接。', timestamp: '03:20' },
                        { heading: '适用边界', detail: '适合快速理解问题，但重要资料仍需要回看来源。', timestamp: null }
                      ],
                      notableDetails: ['视频展示了在 Windows 环境里的实际搜索过程。'],
                      actionAdvice: ['先用它处理低风险资料检索，再决定是否进入日常工作流。']
                    })
                  }
                ]
              }
            }
          ]
        })
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const article = await generateArticleWithGemini({
      apiKey: 'gemini-key',
      model: 'gemini-2.5-flash',
      metadata: {
        title: 'Google 把 AI 搜索塞进 Windows',
        description: 'AI 搜索体验',
        channel: '零度解说',
        url: 'https://www.youtube.com/watch?v=77dNa9uscTM'
      },
      transcript: '[00:00] Google AI Search on Windows'
    });

    expect(article.title).toBe('Google AI Search on Windows');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-goog-api-key': 'gemini-key'
        })
      })
    );

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseJsonSchema.required).toContain('keyPoints');
  });

  it('falls back to Flash-Lite when the primary Gemini model is temporarily overloaded', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: {
            message:
              'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.'
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      title: 'Fallback article',
                      description: '一篇通过备用模型生成的摘要。',
                      tags: ['AI'],
                      keywords: ['Gemini'],
                      summary:
                        '主模型临时高需求时，系统会自动使用备用模型完成文章生成，保证自动发布流程在容量波动时仍能继续运行。',
                      keyPoints: [
                        { heading: '备用模型', detail: '备用模型保证自动发布流程不中断。', timestamp: null },
                        { heading: '结构化输出', detail: '备用模型仍然返回同样的 JSON 结构。', timestamp: null },
                        { heading: '发布稳定性', detail: '临时容量问题不再直接导致整条内容失败。', timestamp: null }
                      ],
                      notableDetails: [],
                      actionAdvice: []
                    })
                  }
                ]
              }
            }
          ]
        })
      });
    vi.stubGlobal('fetch', fetchMock);

    const article = await generateArticleWithGemini({
      apiKey: 'gemini-key',
      model: 'gemini-2.5-flash',
      metadata: {
        title: 'Google 把 AI 搜索塞进 Windows',
        description: 'AI 搜索体验',
        channel: '零度解说',
        url: 'https://www.youtube.com/watch?v=77dNa9uscTM'
      },
      transcript: '[00:00] Google AI Search on Windows'
    });

    expect(article.title).toBe('Fallback article');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent'
    );
  });
});
