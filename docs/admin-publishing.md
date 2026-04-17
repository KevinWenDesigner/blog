# Admin Publishing Setup

The blog remains a static Astro site on GitHub Pages. Browser-based publishing is handled by Decap CMS at `/admin/`, while GitHub OAuth runs on a separate Cloudflare Worker so no GitHub token or client secret is shipped to the browser.

## 1. Deploy the OAuth Worker

1. Copy `admin-oauth-worker/wrangler.toml.example` to `admin-oauth-worker/wrangler.toml`.
2. Set `ALLOWED_GITHUB_USERS` to a comma-separated list of GitHub logins that may publish.
3. Create a GitHub OAuth App:
   - Homepage URL: the OAuth worker URL, for example `https://decap.example.com`
   - Authorization callback URL: the worker URL plus `/callback`, for example `https://decap.example.com/callback`
4. Add worker secrets:

```bash
cd admin-oauth-worker
npx wrangler secret put GITHUB_OAUTH_ID
npx wrangler secret put GITHUB_OAUTH_SECRET
npx wrangler deploy
```

## 2. Configure the Blog Build

Set these variables for local builds and GitHub Actions:

```bash
SITE_URL=https://<user>.github.io/<repo>
BASE_PATH=/<repo>/
ADMIN_GITHUB_REPO=<user>/<repo>
ADMIN_BRANCH=main
ADMIN_OAUTH_BASE_URL=https://decap.example.com
ADMIN_AUTH_ENDPOINT=/auth
ADMIN_CATEGORIES=笔记,工程化,教程,踩坑,读书
```

The generated CMS config is available at `/admin/config.yml`. It writes Markdown files to `src/content/blog/` and uploaded files to `public/uploads/`.

## 3. Publish From the Browser

1. Open `/admin/`.
2. Sign in with an allowed GitHub account.
3. Create or edit an article.
4. Publish the entry. Decap CMS commits to the configured branch.
5. GitHub Actions rebuilds and deploys the site.

Do not put GitHub personal access tokens, OAuth client secrets, or worker secrets in this repository.
