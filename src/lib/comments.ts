export type GiscusInput = {
  repo?: string;
  repoId?: string;
  category?: string;
  categoryId?: string;
  mapping?: string;
  strict?: string;
  reactionsEnabled?: string;
  emitMetadata?: string;
  inputPosition?: string;
  theme?: string;
  lang?: string;
  loading?: string;
};

export type GiscusConfig = {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping: string;
  strict: string;
  reactionsEnabled: string;
  emitMetadata: string;
  inputPosition: string;
  theme: string;
  lang: string;
  loading: string;
};

function clean(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getGiscusConfig(input: GiscusInput): GiscusConfig | null {
  const repo = clean(input.repo);
  const repoId = clean(input.repoId);
  const category = clean(input.category);
  const categoryId = clean(input.categoryId);

  if (!repo || !repoId || !category || !categoryId) {
    return null;
  }

  return {
    repo,
    repoId,
    category,
    categoryId,
    mapping: clean(input.mapping) ?? 'pathname',
    strict: clean(input.strict) ?? '0',
    reactionsEnabled: clean(input.reactionsEnabled) ?? '1',
    emitMetadata: clean(input.emitMetadata) ?? '0',
    inputPosition: clean(input.inputPosition) ?? 'bottom',
    theme: clean(input.theme) ?? 'preferred_color_scheme',
    lang: clean(input.lang) ?? 'zh-CN',
    loading: clean(input.loading) ?? 'lazy'
  };
}
