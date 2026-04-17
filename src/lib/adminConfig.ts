export type AdminConfigInput = {
  githubRepo?: string;
  branch?: string;
  oauthBaseUrl?: string;
  authEndpoint?: string;
  basePath?: string;
  siteUrl?: string;
  categories?: string[];
};

const DEFAULT_CATEGORIES = ['笔记', '工程化', '教程', '踩坑', '读书'];

function normalizeBasePath(basePath = '/'): string {
  if (!basePath || basePath === '/') {
    return '/';
  }

  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

function normalizeSiteUrl(siteUrl = 'https://example.invalid', basePath = '/'): string {
  const normalizedBase = normalizeBasePath(basePath);
  const trimmedSite = siteUrl.replace(/\/+$/, '');

  if (normalizedBase === '/') {
    return `${trimmedSite}/`;
  }

  try {
    const url = new URL(trimmedSite);
    const sitePath = url.pathname.replace(/\/+$/, '');
    const baseWithoutTrailingSlash = normalizedBase.replace(/\/+$/, '');

    if (sitePath === baseWithoutTrailingSlash) {
      return `${trimmedSite}/`;
    }
  } catch {
    return `${trimmedSite}${normalizedBase}`;
  }

  return `${trimmedSite}${normalizedBase}`;
}

function yamlList(values: string[]): string {
  return values.map((value) => `              - ${JSON.stringify(value)}`).join('\n');
}

export function buildAdminConfig(input: AdminConfigInput): string {
  const basePath = normalizeBasePath(input.basePath);
  const githubRepo = input.githubRepo?.trim() || 'REPLACE_WITH_OWNER/REPLACE_WITH_REPO';
  const branch = input.branch?.trim() || 'main';
  const oauthBaseUrl = input.oauthBaseUrl?.replace(/\/+$/, '') || 'https://decap-oauth.example.invalid';
  const authEndpoint = input.authEndpoint?.trim() || 'auth';
  const publicFolder = `${basePath}uploads`;
  const siteUrl = normalizeSiteUrl(input.siteUrl, basePath);
  const categories = input.categories?.length ? input.categories : DEFAULT_CATEGORIES;

  return `backend:
  name: github
  repo: ${githubRepo}
  branch: ${branch}
  base_url: ${oauthBaseUrl}
  auth_endpoint: ${authEndpoint}
  use_graphql: true

site_url: ${siteUrl}
display_url: ${siteUrl}
media_folder: public/uploads
public_folder: ${publicFolder}
publish_mode: simple
locale: zh_Hans

collections:
  - name: blog
    label: 文章
    label_singular: 文章
    folder: src/content/blog
    create: true
    format: frontmatter
    extension: md
    slug: "{{slug}}"
    identifier_field: title
    summary: "{{title}} - {{pubDate}}"
    editor:
      preview: false
    fields:
      - label: 标题
        name: title
        widget: string
        required: true
      - label: 摘要
        name: description
        widget: text
        required: true
      - label: 发布时间
        name: pubDate
        widget: datetime
        required: true
        date_format: YYYY-MM-DD
        time_format: false
      - label: 更新时间
        name: updatedDate
        widget: datetime
        required: false
        date_format: YYYY-MM-DD
        time_format: false
      - label: 分类
        name: category
        widget: select
        required: true
        options:
${yamlList(categories)}
      - label: 标签
        name: tags
        widget: list
        required: false
        default: []
        field:
          label: 标签
          name: tag
          widget: string
      - label: 搜索关键词
        name: keywords
        widget: list
        required: false
        default: []
        field:
          label: 关键词
          name: keyword
          widget: string
      - label: 草稿
        name: draft
        widget: boolean
        required: false
        default: false
      - label: 开启评论
        name: comments
        widget: boolean
        required: false
        default: true
      - label: 正文
        name: body
        widget: markdown
        required: true
`;
}
