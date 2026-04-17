import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: { site: URL }) {
  const posts = await getCollection('blog', ({ data }) => data.draft !== true);
  const baseUrl = import.meta.env.BASE_URL;

  return rss({
    title: '技术笔记',
    description: '个人技术学习笔记：教程、踩坑与读书笔记。',
    site: context.site,
    items: posts
      .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `${baseUrl}blog/${post.id}/`
      }))
  });
}

