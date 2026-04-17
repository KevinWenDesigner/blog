# 个人技术博客（Astro + GitHub Pages）— 设计说明

**状态**：已定稿（待实现计划）  
**日期**：2026-04-17  

## 1. 背景与目标

- **用途**：个人 **技术 / 学习笔记**（教程、踩坑、读书笔记）。
- **工作流**：本地 **Markdown** 写作 → **Git** 提交 → **CI 自动构建** → **GitHub Pages** 托管。
- **技术栈**：**Astro**，静态生成；构建与发布由 **GitHub Actions** 完成。

## 2. 范围

### 2.1 v1 必含

- 首页、文章列表、文章详情页。
- Markdown 与 **代码高亮**。
- **RSS**。
- **标签**、**分类** 与 **归档 / 时间线** 类页面。

### 2.2 v1 不做

- 评论、站内搜索、多语言站点框架（可后续增量加入）。

## 3. 架构决策

- **内容**：**Astro Content Collections** + Zod schema 校验 frontmatter。
- **样式**：**Tailwind CSS**（与 Astro 常见实践一致）。
- **RSS**：`@astrojs/rss`；**站点地图**：`@astrojs/sitemap`（依赖正确的 `site` 配置）。
- **可选后续**：MDX、Pagefind 搜索；不在 v1 范围。

## 4. 内容与 frontmatter

- 集合路径约定：`src/content/blog/`（实现时可微调，全站统一）。
- 建议字段：
  - `title`（string，必填）
  - `description`（string，必填）
  - `pubDate`（date，必填）
  - `updatedDate`（date，可选）
  - `category`（string，**v1 必填**，以满足「分类」一致性）
  - `tags`（string[]，可选；空数组表示无标签）
  - `draft`（boolean，可选；`true` 时不出现在列表、RSS、sitemap）

- **草稿**：构建时排除 `draft: true`。

## 5. 路由与信息架构

以下路径为逻辑约定，实现时可微调 slug，但需全站一致：

| 路径 | 说明 |
|------|------|
| `/` | 首页（可含最近文章、简短介绍） |
| `/blog` | 文章列表 |
| `/blog/[slug]` | 文章详情 |
| `/tags` | 标签索引 |
| `/tags/[tag]` | 单标签文章列表 |
| `/categories` | 分类索引 |
| `/categories/[category]` | 单分类文章列表 |
| `/archive` | 归档 / 时间线（按年或按年月，实现时选一种并写清） |

- **分页**：v1 可先单页列表或简单分页；若文章量增大再加强。

## 6. GitHub Pages 与 URL

- **当前假设**：仓库 **尚未创建**；优先兼容 **Project Pages 子路径**：
  - 公网地址形态：`https://<user>.github.io/<repo>/`
  - Astro `base` 应设为 `/<repo>/`（`<repo>` 占位，创建仓库后替换为实际仓库名）。
- **`site`**：设为 `https://<user>.github.io/<repo>`（无尾部斜杠，与 Astro 惯例一致；具体 user/repo 在首次部署前填写）。
- 若日后改为 **用户/组织根站**（`https://<user>.github.io/`），将 `base` 调整为 `/` 并更新 `site`。

## 7. CI/CD（GitHub Actions）

- 触发：`push` 到默认分支（如 `main`）。
- 步骤：checkout → 安装 Node（版本与 `package.json`/`engines` 一致）→ 安装依赖 → `npm run build`（或项目统一命令）→ 使用 **GitHub Pages 官方部署动作**（`actions/upload-pages-artifact` + `actions/deploy-pages`）或等效成熟方案发布 `dist/`。
- **机密与权限**：按需开启 `GITHUB_TOKEN` 的 Pages 写权限；不在仓库中存放密钥。

## 8. 代码展示与可读性

- 使用 Astro 生态常见方案（如 **Shiki**）高亮；主题与是否显示行号为实现细节，全站统一即可。

## 9. 界面语言

- **导航与站点固定文案**：以 **中文** 为主。
- **正文**：由每篇 Markdown 决定（可与中文笔记一致）。

## 10. 错误与边界

- frontmatter 不符合 schema 时 **构建失败**，避免静默发布错误内容。
- 无效链接、空标签列表：按实现约定处理（例如不生成空标签页或不在索引显示空标签）。

## 11. 验收标准（v1）

- 本地与 CI `build` 通过。
- 主要路由可访问；样例文章含 **分类 + 标签** 时，列表、标签页、分类页、归档与详情一致。
- `rss.xml`（或项目统一命名的 feed）与 `sitemap.xml` 可访问且 URL 与 `site`/`base` 一致。

## 12. 非目标（重申）

- 不实现评论、搜索、多语言框架；不绑定特定商业托管（仅 GitHub Pages）。
