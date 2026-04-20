# 个人技术笔记（Astro + GitHub Pages）

本项目是一个 **静态技术博客**：本地写 Markdown，GitHub Actions 自动构建并部署到 GitHub Pages（Project Pages）。

## 功能

- Markdown 技术笔记、代码高亮、标签、分类、归档
- 站内搜索（Pagefind，构建后生成静态索引）
- 文章目录、阅读时间、更新日期、相关文章、较新/较早文章导航
- 浏览器写作后台（Decap CMS + GitHub OAuth 白名单）
- GitHub Discussions 评论（Giscus，可按文章关闭）
- YouTube 自动发现与摘要发布（GitHub Actions + yt-dlp + OpenAI）
- RSS、sitemap、GitHub Pages 自动部署

## 本地运行

```bash
npm install
npm run dev
```

## 写文章

文章放在 `src/content/blog/`，文件名会成为 URL（例如 `hello-astro.md` → `/blog/hello-astro/`）。

Frontmatter 模板（`category` 在 v1 **必填**）：

```md
---
title: 标题
description: 一句话摘要
pubDate: 2026-04-17
updatedDate: 2026-04-18 # 可选
category: 笔记
tags: [Astro, Tailwind] # 可选
keywords: [CI, 部署]    # 可选；补充搜索关键词
draft: false           # 可选；true 时不会出现在列表 / RSS / sitemap
comments: true         # 可选；false 时关闭该文章评论
---
```

## 常用命令

```bash
npm test
npm run build
```

`npm run build` 会先执行 Astro 静态构建，再通过 `postbuild` 运行 Pagefind，把搜索索引写入 `dist/pagefind/`。

## GitHub Pages（Project Pages）配置

本项目通过环境变量配置 `site/base`，确保 **RSS / sitemap** 在 Project Pages 子路径下也生成正确链接。

1. 复制 `.env.example` 为 `.env`
2. 设置：
   - `SITE_URL=https://<user>.github.io/<repo>`（无尾部斜杠）
   - `BASE_PATH=/<repo>/`

本地验证 RSS、sitemap 或搜索结果链接前，请先设置 `.env`，否则默认会使用 `https://example.invalid`。

## 浏览器写作后台

后台入口是 `/admin/`。它使用 Decap CMS 直接编辑 `src/content/blog/` 中的 Markdown，并通过 GitHub commit 触发 Actions 发布。

需要配置：

```bash
ADMIN_GITHUB_REPO=<user>/<repo>
ADMIN_BRANCH=main
ADMIN_OAUTH_BASE_URL=https://decap-oauth.example.com
ADMIN_AUTH_ENDPOINT=auth
ADMIN_CATEGORIES=笔记,工程化,教程,踩坑,读书
```

OAuth 代理部署说明见 `docs/admin-publishing.md`。不要把 GitHub token、OAuth client secret 或 Cloudflare secrets 提交进仓库。

## YouTube 自动发布

自动化工作流定义在 `.github/workflows/autoblog.yml`。它会按计划任务读取 `automation/channels.json` 中的频道白名单，抓取匹配关键词的新视频，抽取字幕并生成 Markdown，最后直接提交到 `src/content/blog/`。

需要配置：

```bash
OPENAI_API_KEY=<secret>
AUTOBLOG_OPENAI_MODEL=gpt-4o-mini
```

`automation/channels.json` 结构示例：

```json
{
  "categoryRules": [
    { "category": "工程化", "keywords": ["workflow", "pipeline", "automation"] }
  ],
  "channels": [
    {
      "channelId": "UCxxxx",
      "label": "Channel Name",
      "defaultCategory": "读书",
      "includeKeywords": ["openai", "agent"],
      "excludeKeywords": ["podcast"],
      "defaultTags": ["AI", "YouTube"]
    }
  ]
}
```

默认行为：

- 每个视频生成一篇文章
- 只处理能稳定抓到字幕的视频
- 直接发布，不进草稿箱
- 无字幕、重复视频、模型失败会记录到 `.autoblog/autoblog-report.json`

## 评论功能

评论使用 Giscus + GitHub Discussions。配置仓库 Discussions、安装 Giscus App 后，把 https://giscus.app/ 生成的值写入：

```bash
PUBLIC_GISCUS_REPO=<user>/<repo>
PUBLIC_GISCUS_REPO_ID=...
PUBLIC_GISCUS_CATEGORY=Comments
PUBLIC_GISCUS_CATEGORY_ID=...
PUBLIC_GISCUS_THEME=light
```

缺少任一必填值时，评论区不会渲染。单篇文章可用 `comments: false` 关闭评论。

## 部署（GitHub Actions）

已提供工作流：`.github/workflows/deploy.yml`

在 GitHub 仓库里需要配置：

- Settings → Pages → Source 选择 **GitHub Actions**
- 默认分支建议使用 `main`
