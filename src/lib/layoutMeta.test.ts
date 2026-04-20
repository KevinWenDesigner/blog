import { describe, expect, it } from 'vitest';

import { DEFAULT_SITE_DESCRIPTION, resolvePageMeta } from './layoutMeta';

describe('resolvePageMeta', () => {
  it('falls back to the site description and default OG image', () => {
    const meta = resolvePageMeta({
      site: 'https://kevinwendesigner.github.io/blog',
      pathname: '/blog/',
      baseUrl: '/blog/'
    });

    expect(meta.description).toBe(DEFAULT_SITE_DESCRIPTION);
    expect(meta.canonicalUrl.toString()).toBe('https://kevinwendesigner.github.io/blog/');
    expect(meta.ogImage.toString()).toBe('https://kevinwendesigner.github.io/blog/default-og.png');
    expect(meta.ogType).toBe('website');
    expect(meta.publishedTime).toBeUndefined();
  });

  it('keeps explicit page metadata when provided', () => {
    const publishedAt = new Date('2026-04-17T00:00:00.000Z');
    const meta = resolvePageMeta({
      site: 'https://example.com',
      pathname: '/blog/post/',
      baseUrl: '/',
      description: 'Custom article description',
      image: '/images/custom-og.png',
      articleDate: publishedAt
    });

    expect(meta.description).toBe('Custom article description');
    expect(meta.canonicalUrl.toString()).toBe('https://example.com/blog/post/');
    expect(meta.ogImage.toString()).toBe('https://example.com/images/custom-og.png');
    expect(meta.ogType).toBe('article');
    expect(meta.publishedTime).toBe('2026-04-17T00:00:00.000Z');
  });
});
