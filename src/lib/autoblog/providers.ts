export type ArticleGeneratorProvider = 'gemini' | 'openai';

type ProviderEnv = Partial<Record<string, string | undefined>>;

export type ArticleGeneratorConfig = {
  provider: ArticleGeneratorProvider;
  apiKey: string;
  model?: string;
};

function normalizeProvider(value: string | undefined): ArticleGeneratorProvider | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized === 'gemini' || normalized === 'openai') {
    return normalized;
  }

  throw new Error(`Unsupported AUTOBLOG_LLM_PROVIDER: ${value}`);
}

export function resolveArticleGeneratorConfig(env: ProviderEnv): ArticleGeneratorConfig {
  const explicitProvider = normalizeProvider(env.AUTOBLOG_LLM_PROVIDER);
  const provider = explicitProvider ?? (env.GEMINI_API_KEY?.trim() ? 'gemini' : 'openai');

  if (provider === 'gemini') {
    const apiKey = env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    return {
      provider,
      apiKey,
      model: env.AUTOBLOG_GEMINI_MODEL?.trim() || undefined
    };
  }

  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  return {
    provider,
    apiKey,
    model: env.AUTOBLOG_OPENAI_MODEL?.trim() || undefined
  };
}
