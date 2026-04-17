// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // GitHub Project Pages support:
  // - For user/organization pages, base should typically be "/"
  // - For project pages, base is usually "/<repo>/"
  // Keep these as env-driven placeholders until the repo + Pages URL exist.
  site: process.env.SITE_URL ?? 'https://example.invalid',
  base: process.env.BASE_PATH ?? '/',

  vite: {
    plugins: [tailwindcss()]
  },

  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      theme: 'github-dark'
    }
  },

  integrations: [sitemap()]
});
