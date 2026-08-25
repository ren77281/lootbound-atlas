import { describe, it, expect } from 'vitest';
import { parseEntryId, isPossiblyOutdated, STALE_AFTER_DAYS } from '~/lib/content-utils';

describe('parseEntryId', () => {
  it('parses a simple id into locale/category/slug', () => {
    expect(parseEntryId('en/bosses/emberfang')).toEqual({
      locale: 'en',
      category: 'bosses',
      slug: 'emberfang',
    });
  });

  it('strips the .mdx extension the glob loader includes in the id', () => {
    expect(parseEntryId('en/bosses/emberfang.mdx')).toEqual({
      locale: 'en',
      category: 'bosses',
      slug: 'emberfang',
    });
  });

  it('keeps nested slug segments joined with /', () => {
    expect(parseEntryId('en/guides/sub/deep/page')).toEqual({
      locale: 'en',
      category: 'guides',
      slug: 'sub/deep/page',
    });
  });

  it('returns null when the locale segment is not a configured locale', () => {
    expect(parseEntryId('fr/bosses/emberfang')).toBeNull();
  });

  it('returns null when there are fewer than 3 segments', () => {
    expect(parseEntryId('en/bosses')).toBeNull();
    expect(parseEntryId('en')).toBeNull();
    expect(parseEntryId('')).toBeNull();
  });
});

describe('isPossiblyOutdated', () => {
  const now = new Date('2026-08-16T00:00:00Z');
  const fresh = new Date('2026-08-01T00:00:00Z'); // 15 days before now
  const stale = new Date('2025-08-01T00:00:00Z'); // > 1 year before now

  it('is false for categories outside STALE_CATEGORIES regardless of age', () => {
    expect(isPossiblyOutdated('guides', undefined, stale, now)).toBe(false);
    expect(isPossiblyOutdated('codes', undefined, stale, now)).toBe(false);
  });

  it('is false for a fresh stale-category article', () => {
    expect(isPossiblyOutdated('bosses', undefined, fresh, now)).toBe(false);
  });

  it('is true once the article is older than STALE_AFTER_DAYS', () => {
    const justUnder = new Date(now.getTime() - (STALE_AFTER_DAYS - 1) * 86400000);
    const justOver = new Date(now.getTime() - (STALE_AFTER_DAYS + 1) * 86400000);
    expect(isPossiblyOutdated('bosses', undefined, justUnder, now)).toBe(false);
    expect(isPossiblyOutdated('bosses', undefined, justOver, now)).toBe(true);
  });

  it('prefers lastModified over the publish date', () => {
    // Published long ago but touched recently → not outdated.
    expect(isPossiblyOutdated('tier-list', fresh, stale, now)).toBe(false);
    // Published recently but lastModified is ancient → outdated (data bug,
    // but the function must honor the explicit field).
    expect(isPossiblyOutdated('tier-list', stale, fresh, now)).toBe(true);
  });
});
