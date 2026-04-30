export type PostData = {
  pubDate: Date;
  category: string;
  tags: string[];
  draft: boolean;
  keywords?: string[];
};

export type PostLike = {
  data: PostData;
};

export type IdentifiedPostLike = PostLike & {
  id: string;
};

export function isPublished(post: Pick<PostLike, 'data'>): boolean {
  return post.data.draft !== true;
}

export function sortByPubDateDesc<T extends Pick<PostLike, 'data'>>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function yearMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function taxonomyPathSegment(value: string): string {
  return value.replace(/\//g, '%2F');
}

export function groupByCategory<T extends Pick<PostLike, 'data'>>(posts: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const post of posts) {
    const key = post.data.category;
    const arr = map.get(key) ?? [];
    arr.push(post);
    map.set(key, arr);
  }
  return map;
}

export function groupByTag<T extends Pick<PostLike, 'data'>>(posts: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const post of posts) {
    for (const tag of post.data.tags ?? []) {
      const arr = map.get(tag) ?? [];
      arr.push(post);
      map.set(tag, arr);
    }
  }
  return map;
}

export function groupByYearMonth<T extends Pick<PostLike, 'data'>>(posts: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const post of posts) {
    const key = yearMonthKey(post.data.pubDate);
    const arr = map.get(key) ?? [];
    arr.push(post);
    map.set(key, arr);
  }
  return map;
}

export function getReadingMinutes(content: string): number {
  const latinWords = content.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g)?.length ?? 0;
  const cjkCharacters = content.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const estimatedMinutes = latinWords / 200 + cjkCharacters / 400;
  return Math.max(1, Math.ceil(estimatedMinutes));
}

export function getAdjacentPosts<T extends IdentifiedPostLike>(
  sortedPosts: T[],
  currentId: string
): { newer: T | undefined; older: T | undefined } {
  const index = sortedPosts.findIndex((post) => post.id === currentId);
  if (index === -1) {
    return { newer: undefined, older: undefined };
  }

  return {
    newer: sortedPosts[index - 1],
    older: sortedPosts[index + 1]
  };
}

export function getRelatedPosts<T extends IdentifiedPostLike>(
  posts: T[],
  currentPost: T,
  limit = 3
): T[] {
  const currentTags = new Set(currentPost.data.tags ?? []);

  return posts
    .filter((post) => post.id !== currentPost.id && isPublished(post))
    .map((post) => {
      const sharedTagCount = (post.data.tags ?? []).filter((tag) => currentTags.has(tag)).length;
      const categoryScore = post.data.category === currentPost.data.category ? 1 : 0;

      return {
        post,
        score: sharedTagCount * 10 + categoryScore
      };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const byDate = b.post.data.pubDate.getTime() - a.post.data.pubDate.getTime();
      if (byDate !== 0) {
        return byDate;
      }

      return a.post.id.localeCompare(b.post.id);
    })
    .slice(0, limit)
    .map(({ post }) => post);
}

