import { describe, expect, it } from 'vitest';

import { buildArticleShareUrl } from './share';

describe('buildArticleShareUrl', () => {
  it('builds an absolute article URL from site, base path, and post id', () => {
    expect(
      buildArticleShareUrl({
        site: 'https://example.com',
        basePath: '/',
        postId: 'hello-astro'
      })
    ).toBe('https://example.com/blog/hello-astro/');
  });

  it('keeps the GitHub Pages project path when building article URLs', () => {
    expect(
      buildArticleShareUrl({
        site: 'https://kevinwendesigner.github.io/blog',
        basePath: '/blog/',
        postId: '技术说明superpowers-与-gsd-ai-开发框架对比评估'
      })
    ).toBe(
      'https://kevinwendesigner.github.io/blog/blog/%E6%8A%80%E6%9C%AF%E8%AF%B4%E6%98%8Esuperpowers-%E4%B8%8E-gsd-ai-%E5%BC%80%E5%8F%91%E6%A1%86%E6%9E%B6%E5%AF%B9%E6%AF%94%E8%AF%84%E4%BC%B0/'
    );
  });

  it('does not treat partial path suffixes as an existing base path', () => {
    expect(
      buildArticleShareUrl({
        site: 'https://example.com/myblog',
        basePath: '/blog/',
        postId: 'launch-notes'
      })
    ).toBe('https://example.com/myblog/blog/blog/launch-notes/');
  });
});
