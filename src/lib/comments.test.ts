import { describe, expect, it } from 'vitest';

import { getGiscusConfig } from './comments';

describe('getGiscusConfig', () => {
  it('returns null when required Giscus values are missing', () => {
    expect(
      getGiscusConfig({
        repo: 'owner/blog',
        repoId: 'R_123',
        category: 'Comments'
      })
    ).toBeNull();
  });

  it('builds the default pathname-mapped Chinese Giscus config', () => {
    expect(
      getGiscusConfig({
        repo: 'owner/blog',
        repoId: 'R_123',
        category: 'Comments',
        categoryId: 'DIC_123'
      })
    ).toEqual({
      repo: 'owner/blog',
      repoId: 'R_123',
      category: 'Comments',
      categoryId: 'DIC_123',
      mapping: 'pathname',
      strict: '0',
      reactionsEnabled: '1',
      emitMetadata: '0',
      inputPosition: 'bottom',
      theme: 'preferred_color_scheme',
      lang: 'zh-CN',
      loading: 'lazy'
    });
  });
});
