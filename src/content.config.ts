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
    comments: z.boolean().default(true)
  })
});

export const collections = { blog };

