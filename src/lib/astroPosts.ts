import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';

import { sortByPubDateDesc } from './posts';

export type BlogPost = CollectionEntry<'blog'>;

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => data.draft !== true);
  return sortByPubDateDesc(posts);
}

