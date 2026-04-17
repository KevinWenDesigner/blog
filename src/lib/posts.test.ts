import { describe, expect, it } from 'vitest';
import type { PostLike } from './posts';
import { groupByCategory, groupByTag, groupByYearMonth, isPublished, sortByPubDateDesc } from './posts';

describe('posts helpers', () => {
  it('filters draft posts via isPublished', () => {
    expect(
      isPublished({ data: { pubDate: new Date(), category: 'A', tags: [], draft: true } } satisfies PostLike)
    ).toBe(false);
    expect(
      isPublished({ data: { pubDate: new Date(), category: 'A', tags: [], draft: false } } satisfies PostLike)
    ).toBe(true);
  });

  it('sorts by pubDate desc', () => {
    const a: PostLike = { data: { pubDate: new Date('2026-01-01'), category: 'A', tags: [], draft: false } };
    const b: PostLike = { data: { pubDate: new Date('2026-02-01'), category: 'A', tags: [], draft: false } };
    expect(sortByPubDateDesc([a, b])[0]).toBe(b);
  });

  it('groups by category, tag, and year-month', () => {
    const p1: PostLike = {
      data: { pubDate: new Date('2026-04-17'), category: 'Notes', tags: ['Astro', 'TS'], draft: false }
    };
    const p2: PostLike = { data: { pubDate: new Date('2026-04-02'), category: 'Notes', tags: ['Astro'], draft: false } };
    const p3: PostLike = { data: { pubDate: new Date('2026-03-31'), category: 'Reviews', tags: [], draft: false } };
    const posts: PostLike[] = [p1, p2, p3];

    const byCategory = groupByCategory(posts);
    expect(byCategory.get('Notes')?.length).toBe(2);
    expect(byCategory.get('Reviews')?.length).toBe(1);

    const byTag = groupByTag(posts);
    expect(byTag.get('Astro')?.length).toBe(2);
    expect(byTag.get('TS')?.length).toBe(1);

    const byYm = groupByYearMonth(posts);
    expect(byYm.get('2026-04')?.length).toBe(2);
    expect(byYm.get('2026-03')?.length).toBe(1);
  });
});

