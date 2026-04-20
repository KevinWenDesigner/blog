import { describe, expect, it } from 'vitest';

import { resolveArticleGeneratorConfig } from './providers';

describe('autoblog provider selection', () => {
  it('prefers Gemini when its API key is configured and no provider is explicit', () => {
    expect(
      resolveArticleGeneratorConfig({
        GEMINI_API_KEY: 'gemini-key',
        OPENAI_API_KEY: 'openai-key'
      })
    ).toEqual({
      provider: 'gemini',
      apiKey: 'gemini-key',
      model: undefined
    });
  });

  it('uses an explicit OpenAI provider when requested', () => {
    expect(
      resolveArticleGeneratorConfig({
        AUTOBLOG_LLM_PROVIDER: 'openai',
        OPENAI_API_KEY: 'openai-key',
        AUTOBLOG_OPENAI_MODEL: 'gpt-4o-mini'
      })
    ).toEqual({
      provider: 'openai',
      apiKey: 'openai-key',
      model: 'gpt-4o-mini'
    });
  });

  it('throws a targeted error when the selected provider has no API key', () => {
    expect(() =>
      resolveArticleGeneratorConfig({
        AUTOBLOG_LLM_PROVIDER: 'gemini',
        OPENAI_API_KEY: 'openai-key'
      })
    ).toThrow('Missing GEMINI_API_KEY');
  });
});
