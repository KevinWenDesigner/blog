import { describe, expect, it } from 'vitest';
import type { PostLike } from './posts';
import {
  getAdjacentPosts,
  getReadingMinutes,
  getRelatedPosts,
  groupByCategory,
  groupByTag,
  groupByYearMonth,
  isPublished,
  sortByPubDateDesc
} from './posts';

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

  it('calculates stable reading minutes for short, long, and mixed-language content', () => {
    expect(getReadingMinutes('短文')).toBe(1);

    const englishWords = Array.from({ length: 401 }, (_, index) => `word${index}`).join(' ');
    expect(getReadingMinutes(englishWords)).toBe(3);

    const mixedContent = `${Array.from({ length: 160 }, () => '知识').join('')} ${Array.from(
      { length: 120 },
      (_, index) => `term${index}`
    ).join(' ')}`;
    expect(getReadingMinutes(mixedContent)).toBe(2);
  });

  it('returns adjacent posts from posts already sorted by publication date desc', () => {
    const newest: PostLike & { id: string } = {
      id: 'newest',
      data: { pubDate: new Date('2026-03-01'), category: 'Notes', tags: [], draft: false }
    };
    const current: PostLike & { id: string } = {
      id: 'current',
      data: { pubDate: new Date('2026-02-01'), category: 'Notes', tags: [], draft: false }
    };
    const oldest: PostLike & { id: string } = {
      id: 'oldest',
      data: { pubDate: new Date('2026-01-01'), category: 'Notes', tags: [], draft: false }
    };

    expect(getAdjacentPosts([newest, current, oldest], 'current')).toEqual({
      newer: newest,
      older: oldest
    });
    expect(getAdjacentPosts([newest, current, oldest], 'missing')).toEqual({
      newer: undefined,
      older: undefined
    });
  });

  it('ranks related posts by shared tags, category match, and date while excluding current and drafts', () => {
    const current: PostLike & { id: string } = {
      id: 'current',
      data: { pubDate: new Date('2026-04-17'), category: 'Astro', tags: ['Search', 'UX'], draft: false }
    };
    const tagMatchOlder: PostLike & { id: string } = {
      id: 'tag-match-older',
      data: { pubDate: new Date('2026-04-01'), category: 'Notes', tags: ['Search'], draft: false }
    };
    const tagMatchNewer: PostLike & { id: string } = {
      id: 'tag-match-newer',
      data: { pubDate: new Date('2026-04-10'), category: 'Notes', tags: ['UX'], draft: false }
    };
    const categoryMatch: PostLike & { id: string } = {
      id: 'category-match',
      data: { pubDate: new Date('2026-04-15'), category: 'Astro', tags: [], draft: false }
    };
    const unrelated: PostLike & { id: string } = {
      id: 'unrelated',
      data: { pubDate: new Date('2026-04-16'), category: 'Other', tags: [], draft: false }
    };
    const draft: PostLike & { id: string } = {
      id: 'draft',
      data: { pubDate: new Date('2026-04-20'), category: 'Astro', tags: ['Search', 'UX'], draft: true }
    };

    expect(
      getRelatedPosts([current, tagMatchOlder, tagMatchNewer, categoryMatch, unrelated, draft], current).map(
        (post) => post.id
      )
    ).toEqual(['tag-match-newer', 'tag-match-older', 'category-match']);
  });
});

