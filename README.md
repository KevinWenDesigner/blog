# 个人技术笔记（Astro + GitHub Pages）

本项目是一个 **静态技术博客**：本地写 Markdown，GitHub Actions 自动构建并部署到 GitHub Pages（Project Pages）。

## 功能

- Markdown 技术笔记、代码高亮、标签、分类、归档
- 站内搜索（Pagefind，构建后生成静态索引）
- 文章目录、阅读时间、更新日期、相关文章、较新/较早文章导航
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

## 部署（GitHub Actions）

已提供工作流：`.github/workflows/deploy.yml`

在 GitHub 仓库里需要配置：

- Settings → Pages → Source 选择 **GitHub Actions**
- 默认分支建议使用 `main`
