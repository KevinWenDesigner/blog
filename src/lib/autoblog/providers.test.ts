import { describe, expect, it } from 'vitest';

import { resolveArticleGeneratorConfig, resolveArticleGeneratorConfigs } from './providers';

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

  it('returns an alternate provider attempt when both API keys are configured', () => {
    expect(
      resolveArticleGeneratorConfigs({
        AUTOBLOG_LLM_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'gemini-key',
        AUTOBLOG_GEMINI_MODEL: 'gemini-2.5-flash',
        OPENAI_API_KEY: 'openai-key',
        AUTOBLOG_OPENAI_MODEL: 'gpt-4o-mini'
      })
    ).toEqual([
      {
        provider: 'gemini',
        apiKey: 'gemini-key',
        model: 'gemini-2.5-flash'
      },
      {
        provider: 'openai',
        apiKey: 'openai-key',
        model: 'gpt-4o-mini'
      }
    ]);
  });

  it('uses only the primary provider when no alternate API key is configured', () => {
    expect(
      resolveArticleGeneratorConfigs({
        AUTOBLOG_LLM_PROVIDER: 'openai',
        OPENAI_API_KEY: 'openai-key'
      })
    ).toEqual([
      {
        provider: 'openai',
        apiKey: 'openai-key',
        model: undefined
      }
    ]);
  });
});
