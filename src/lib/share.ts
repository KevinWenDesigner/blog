type ArticleShareUrlInput = {
  site?: string | URL;
  basePath?: string;
  postId: string;
};

function normalizeBasePath(basePath = '/'): string {
  const trimmed = basePath.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }

  return trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
}

function encodePostId(postId: string): string {
  return postId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function hasTrailingPathSegments(path: string, trailingPath: string): boolean {
  const pathSegments = normalizeBasePath(path).split('/').filter(Boolean);
  const trailingSegments = normalizeBasePath(trailingPath).split('/').filter(Boolean);

  if (trailingSegments.length === 0 || pathSegments.length < trailingSegments.length) {
    return false;
  }

  return trailingSegments.every(
    (segment, index) => pathSegments[pathSegments.length - trailingSegments.length + index] === segment
  );
}

export function buildArticleShareUrl({ site, basePath, postId }: ArticleShareUrlInput): string {
  const siteUrl = new URL(site?.toString() || 'https://example.invalid');
  const normalizedBasePath = normalizeBasePath(basePath);
  const baseAlreadyInSite = hasTrailingPathSegments(siteUrl.pathname, normalizedBasePath);
  const articlePath = [baseAlreadyInSite ? '' : normalizedBasePath, 'blog', encodePostId(postId)]
    .filter(Boolean)
    .join('/');

  return new URL(`${articlePath}/`, `${siteUrl.toString().replace(/\/+$/, '')}/`).toString();
}
