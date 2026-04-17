import { buildAdminConfig } from '../../lib/adminConfig';

export const prerender = true;

export function GET() {
  return new Response(
    buildAdminConfig({
      githubRepo: import.meta.env.ADMIN_GITHUB_REPO,
      branch: import.meta.env.ADMIN_BRANCH,
      oauthBaseUrl: import.meta.env.ADMIN_OAUTH_BASE_URL,
      authEndpoint: import.meta.env.ADMIN_AUTH_ENDPOINT,
      basePath: import.meta.env.BASE_PATH,
      siteUrl: import.meta.env.SITE_URL,
      categories: import.meta.env.ADMIN_CATEGORIES?.split(',').map((category: string) => category.trim()).filter(Boolean)
    }),
    {
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8'
      }
    }
  );
}
