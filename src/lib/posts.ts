export type PostData = {
  pubDate: Date;
  category: string;
  tags: string[];
  draft: boolean;
};

export type PostLike = {
  data: PostData;
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

