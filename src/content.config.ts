import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string().min(1),
    tags: z.array(z.string().min(1)).default([]),
    keywords: z.array(z.string().min(1)).default([]),
    draft: z.boolean().default(false),
    comments: z.boolean().default(true),
    source: z
      .object({
        platform: z.literal('youtube'),
        videoId: z.string().min(1),
        url: z.string().url(),
        channel: z.string().min(1),
        originalTitle: z.string().min(1),
        publishedAt: z.string().min(1),
        thumbnail: z.string().url().optional()
      })
      .optional()
  })
});

export const collections = { blog };

