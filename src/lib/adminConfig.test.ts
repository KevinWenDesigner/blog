import { describe, expect, it } from 'vitest';

import { buildAdminConfig } from './adminConfig';

describe('buildAdminConfig', () => {
  it('generates a Decap CMS GitHub backend config with the OAuth proxy settings', () => {
    const config = buildAdminConfig({
      githubRepo: 'owner/blog',
      branch: 'main',
      oauthBaseUrl: 'https://decap.example.com',
      basePath: '/blog/',
      siteUrl: 'https://owner.github.io/blog'
    });

    expect(config).toContain('backend:');
    expect(config).toContain('name: github');
    expect(config).toContain('repo: owner/blog');
    expect(config).toContain('branch: main');
    expect(config).toContain('base_url: https://decap.example.com');
    expect(config).toContain('auth_endpoint: /auth');
    expect(config).toContain('site_url: https://owner.github.io/blog/');
  });

  it('keeps uploads under the configured GitHub Pages base path', () => {
    const config = buildAdminConfig({
      githubRepo: 'owner/blog',
      branch: 'main',
      oauthBaseUrl: 'https://decap.example.com',
      basePath: '/project/',
      siteUrl: 'https://owner.github.io/project'
    });

    expect(config).toContain('media_folder: public/uploads');
    expect(config).toContain('public_folder: /project/uploads');
  });

  it('includes all frontmatter fields used by the Astro content schema', () => {
    const config = buildAdminConfig({
      githubRepo: 'owner/blog',
      branch: 'main',
      oauthBaseUrl: 'https://decap.example.com',
      basePath: '/',
      siteUrl: 'https://owner.github.io'
    });

    for (const field of ['title', 'description', 'pubDate', 'updatedDate', 'category', 'tags', 'keywords', 'draft', 'comments']) {
      expect(config).toContain(`name: ${field}`);
    }
  });
});
