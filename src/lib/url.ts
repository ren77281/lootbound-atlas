/**
 * URL construction utilities.
 *
 * Centralizes all locale-prefix logic so components never hand-build URLs.
 * English (default locale) has no prefix; other locales are prefixed.
 */

import { defaultLocale, type Locale } from '~/i18n/routing';
import { siteUrl } from '~/config/site';

/** Build a path with the locale prefix applied (or none for default locale). */
export function localizePath(path: string, locale: Locale): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return cleanPath;
  // For the root path "/", avoid producing "/<locale>/" (trailing slash).
  // The site uses trailingSlash: 'never', so "/ja/" would 404.
  if (cleanPath === '/') return `/${locale}`;
  return `/${locale}${cleanPath}`;
}

/** Build an absolute URL (with domain) for a path + locale. */
export function absoluteUrl(path: string, locale: Locale): string {
  return `${siteUrl}${localizePath(path, locale)}`;
}

/** Home URL for a locale. */
export function homeUrl(locale: Locale): string {
  return localizePath('/', locale);
}

/** List page URL for a category + locale. e.g. localizeListPath('bosses', 'en') -> '/bosses' */
export function listPath(category: string, locale: Locale): string {
  return localizePath(`/${category}`, locale);
}

/** Article detail URL. e.g. detailPath('bosses', 'emberfang', 'en') -> '/bosses/emberfang' */
export function detailPath(category: string, slug: string, locale: Locale): string {
  return localizePath(`/${category}/${slug}`, locale);
}

/** Tag index URL for a locale. e.g. tagsPath('en') -> '/tags' */
export function tagsPath(locale: Locale): string {
  return localizePath('/tags', locale);
}

/**
 * Tag aggregation page URL. `tagSlug` must come from slugifyTag() so article
 * tag links and the route params always match.
 */
export function tagPath(tagSlug: string, locale: Locale): string {
  return localizePath(`/tags/${tagSlug}`, locale);
}

/** Recent-updates page URL for a locale. */
export function recentPath(locale: Locale): string {
  return localizePath('/recent', locale);
}

/**
 * Generate hreflang alternates for an article/category page.
 * Returns a list suitable for injection as <link rel="alternate"> tags.
 * x-default is NOT included here — BaseLayout derives it from the alternates.
 */
export function languageAlternates(
  buildPath: (locale: Locale) => string,
  locales: readonly Locale[],
): Array<{ hreflang: string; href: string }> {
  return locales.map((loc) => ({
    hreflang: loc,
    href: `${siteUrl}${buildPath(loc)}`,
  }));
}

/**
 * Slugify a tag for use in URLs: lowercase, whitespace/underscores → "-".
 * Tag pages are keyed by this slug; both article tag links and route
 * params go through this function so they always match. Pure function
 * (testable without a build).
 */
export function slugifyTag(tag: string): string {
  const slug = tag
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  // Non-ASCII tags (CJK etc.) would collapse to '' — which would route all
  // of them to the same /tags/ page. Fall back to the raw tag: Astro writes
  // params to disk verbatim, so a percent-encoded value here becomes a
  // literal '%E7...' directory that only serves at the double-encoded URL,
  // while every in-page link points at the single-encoded form (404). The
  // raw tag builds a raw-named directory that both URL forms resolve to.
  return slug || tag.trim();
}

/** 将 Astro 构建路径转换为 Cloudflare Pages 的无后缀公开路径。 */
export function normalizePagePath(pathname: string): string {
  if (pathname === '/index.html') return '/';
  return pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
}
