# Personal Tech Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Astro-based personal technical blog with Markdown authoring, tags/categories/archive pages, RSS, and GitHub Pages deployment via GitHub Actions.

**Architecture:** Use Astro Content Collections (`src/content/blog`) as the single source of truth for posts with strict schema validation. Generate index/detail/tags/categories/archive pages through static routes and shared query helpers. Deploy static output to GitHub Pages (Project Pages path mode) using official Pages actions.

**Tech Stack:** Astro, TypeScript, Tailwind CSS, @astrojs/rss, @astrojs/sitemap, GitHub Actions

---

## File Structure Mapping

- `package.json`: scripts and dependencies.
- `astro.config.mjs`: set `site`, `base`, integrations, markdown/highlight options.
- `tailwind.config.*`, `postcss.config.*`, `src/styles/global.css`: Tailwind setup.
- `src/content/config.ts`: collection schema and content validation.
- `src/content/blog/*.md`: sample posts with required frontmatter.
- `src/layouts/BaseLayout.astro`: shared page chrome and metadata.
- `src/components/PostCard.astro`: reusable post list item.
- `src/lib/posts.ts`: post filtering/sorting/grouping helpers.
- `src/pages/index.astro`: homepage with recent posts.
- `src/pages/blog/index.astro`: all posts listing.
- `src/pages/blog/[...slug].astro` (or `[slug].astro`): post detail render.
- `src/pages/tags/index.astro`, `src/pages/tags/[tag].astro`: tags index/detail.
- `src/pages/categories/index.astro`, `src/pages/categories/[category].astro`: categories index/detail.
- `src/pages/archive/index.astro`: time archive page.
- `src/pages/rss.xml.ts`: RSS feed route.
- `src/pages/404.astro`: minimal not-found page.
- `.github/workflows/deploy.yml`: build + Pages deploy workflow.
- `README.md`: local run, write-post, and deploy instructions.

### Task 1: Bootstrap Astro Project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `src/pages/index.astro` (scaffold defaults)
- Create: base Astro project files from CLI

- [ ] **Step 1: Initialize Astro project with TypeScript template**
- [ ] **Step 2: Install dependencies and run `npm run dev` once**
- [ ] **Step 3: Run `npm run build` and confirm scaffold builds cleanly**
- [ ] **Step 4: Commit bootstrap files**

### Task 2: Configure Styling and Site Metadata

**Files:**
- Modify: `astro.config.mjs`
- Create/Modify: Tailwind and global style files
- Modify: `src/layouts/BaseLayout.astro` (or create if absent)

- [ ] **Step 1: Add Tailwind integration and global stylesheet wiring**
- [ ] **Step 2: Configure `site` and `base` placeholders for Project Pages compatibility**
- [ ] **Step 3: Set markdown code highlighting config (Shiki/default Astro highlighter)**
- [ ] **Step 4: Run `npm run build` to verify config validity**
- [ ] **Step 5: Commit styling and metadata setup**

### Task 3: Define Content Collection Schema (TDD)

**Files:**
- Modify/Create: `src/content/config.ts`
- Create: `src/content/blog/hello-astro.md` (sample valid post)
- Create: `src/content/blog/invalid-missing-category.md` (temporary failing fixture, then remove)

- [ ] **Step 1: Add strict schema (`title`, `description`, `pubDate`, `category`, `tags`, `draft`, `updatedDate`)**
- [ ] **Step 2: Create a temporary invalid post fixture (missing `category`)**
- [ ] **Step 3: Run `npm run build` and confirm schema failure occurs**
- [ ] **Step 4: Fix fixture by adding valid frontmatter (or delete invalid fixture)**
- [ ] **Step 5: Run `npm run build` and confirm pass**
- [ ] **Step 6: Commit schema and sample content**

### Task 4: Implement Post Query Helpers

**Files:**
- Create: `src/lib/posts.ts`
- Test: `src/lib/posts.test.ts` (if using Vitest) or temporary script check

- [ ] **Step 1: Write failing tests/checks for published filtering and date sorting**
- [ ] **Step 2: Implement `getPublishedPosts()` with `draft !== true` filter**
- [ ] **Step 3: Write failing test/check for tag/category grouping**
- [ ] **Step 4: Implement `groupByTag()`, `groupByCategory()`, `groupByYearMonth()`**
- [ ] **Step 5: Run tests (or scripted assertions) and then `npm run build`**
- [ ] **Step 6: Commit helper module**

### Task 5: Build Core Pages (Home, Blog List, Detail)

**Files:**
- Modify/Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/PostCard.astro`
- Modify/Create: `src/pages/index.astro`, `src/pages/blog/index.astro`, `src/pages/blog/[...slug].astro`

- [ ] **Step 1: Create shared layout with nav/footer and SEO title slot**
- [ ] **Step 2: Add reusable post card component**
- [ ] **Step 3: Implement homepage (recent posts)**
- [ ] **Step 4: Implement `/blog` list page (all posts)**
- [ ] **Step 5: Implement post detail route with Markdown rendering**
- [ ] **Step 6: Run `npm run dev` quick manual check for routes**
- [ ] **Step 7: Run `npm run build` and commit**

### Task 6: Build Tags and Categories Pages

**Files:**
- Create: `src/pages/tags/index.astro`, `src/pages/tags/[tag].astro`
- Create: `src/pages/categories/index.astro`, `src/pages/categories/[category].astro`

- [ ] **Step 1: Write minimal failing expectation/check for tag route generation**
- [ ] **Step 2: Implement tags index page with counts**
- [ ] **Step 3: Implement per-tag listing via `getStaticPaths`**
- [ ] **Step 4: Implement categories index and per-category listing**
- [ ] **Step 5: Validate no draft posts appear in any listing**
- [ ] **Step 6: Run `npm run build` and commit**

### Task 7: Build Archive Page and Feed Endpoints

**Files:**
- Create: `src/pages/archive/index.astro`
- Create: `src/pages/rss.xml.ts`
- Modify: `astro.config.mjs` (sitemap integration if not done)

- [ ] **Step 1: Implement archive timeline grouped by year/month**
- [ ] **Step 2: Implement RSS endpoint using published posts only**
- [ ] **Step 3: Enable and verify sitemap generation**
- [ ] **Step 4: Run `npm run build` and verify output files include RSS + sitemap**
- [ ] **Step 5: Commit archive/feed work**

### Task 8: Add GitHub Pages CI/CD

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`

- [ ] **Step 1: Create workflow with Pages permissions and official artifact/deploy actions**
- [ ] **Step 2: Ensure Node version + install + build steps are deterministic (`npm ci`)**
- [ ] **Step 3: Document required GitHub repository settings (Pages source from Actions)**
- [ ] **Step 4: Validate workflow YAML locally (lint/check syntax)**
- [ ] **Step 5: Commit CI/CD files**

### Task 9: Final Verification and Handover

**Files:**
- Modify: `README.md`
- Optional: `src/content/blog/*.md` sample posts cleanup

- [ ] **Step 1: Run full verification (`npm run build`, optional `npm run dev` smoke test)**
- [ ] **Step 2: Verify route checklist (`/`, `/blog`, `/tags`, `/categories`, `/archive`, sample detail)**
- [ ] **Step 3: Verify generated feed and sitemap URLs under Project Pages base assumptions**
- [ ] **Step 4: Update README with write/publish checklist for daily usage**
- [ ] **Step 5: Commit final polish**

## Testing Strategy

- Build-level gating: `npm run build` on every task completion.
- Data safety: schema validation failure first, then fix (TDD-style for content contract).
- Rendering safety: route smoke checks in local dev for each new page family.
- Deployment safety: workflow syntax + Pages permission validation before first push.

## Execution Notes

- Keep commits small and task-scoped (one task, one commit).
- Do not add search/comments/i18n in this implementation (explicitly out of v1 scope).
- Keep `site` and `base` as clearly documented placeholders until GitHub repo name is finalized.
