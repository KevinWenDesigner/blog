export const DEFAULT_SITE_DESCRIPTION = '个人技术学习笔记：教程、踩坑与读书笔记。';
export const DEFAULT_OG_IMAGE_NAME = 'default-og.png';

type ResolvePageMetaInput = {
  site?: string | URL;
  pathname: string;
  baseUrl?: string;
  description?: string;
  image?: string;
  articleDate?: Date;
};

type ResolvedOgType = 'article' | 'website';

export type ResolvedPageMeta = {
  canonicalUrl: URL;
  description: string;
  ogImage: URL;
  ogType: ResolvedOgType;
  publishedTime?: string;
};

function normalizeBaseUrl(baseUrl = '/'): string {
  const trimmed = baseUrl.trim();

  if (!trimmed || trimmed === '/') {
    return '/';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

export function resolvePageMeta({
  site,
  pathname,
  baseUrl,
  description,
  image,
  articleDate
}: ResolvePageMetaInput): ResolvedPageMeta {
  const siteUrl = site?.toString() || 'https://example.invalid';
  const canonicalUrl = new URL(pathname, siteUrl);
  const resolvedDescription = description?.trim() || DEFAULT_SITE_DESCRIPTION;
  const ogImage = image
    ? new URL(image, siteUrl)
    : new URL(`${normalizeBaseUrl(baseUrl)}${DEFAULT_OG_IMAGE_NAME}`, siteUrl);

  return {
    canonicalUrl,
    description: resolvedDescription,
    ogImage,
    ogType: articleDate ? 'article' : 'website',
    publishedTime: articleDate?.toISOString()
  };
}
