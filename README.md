# 个人技术笔记（Astro + GitHub Pages）

本项目是一个 **静态技术博客**：本地写 Markdown，GitHub Actions 自动构建并部署到 GitHub Pages（Project Pages）。

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
draft: false           # 可选；true 时不会出现在列表 / RSS / sitemap
---
```

## 常用命令

```bash
npm test
npm run build
```

## GitHub Pages（Project Pages）配置

本项目通过环境变量配置 `site/base`，确保 **RSS / sitemap** 在 Project Pages 子路径下也生成正确链接。

1. 复制 `.env.example` 为 `.env`
2. 设置：
   - `SITE_URL=https://<user>.github.io/<repo>`（无尾部斜杠）
   - `BASE_PATH=/<repo>/`

## 部署（GitHub Actions）

已提供工作流：`.github/workflows/deploy.yml`

在 GitHub 仓库里需要配置：

- Settings → Pages → Source 选择 **GitHub Actions**
- 默认分支建议使用 `main`


[Test] Git Hook Automation - 2026-04-17
