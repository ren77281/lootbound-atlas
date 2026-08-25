import { describe, it, expect } from 'vitest';
import {
  localizePath,
  listPath,
  detailPath,
  homeUrl,
  slugifyTag,
  absoluteUrl,
  languageAlternates,
} from '~/lib/url';
import type { Locale } from '~/i18n/routing';

// Exercise prefixing independently of this fork's current single-language config.
const nonDefaultLocale = 'ja' as unknown as Locale;

describe('url helpers', () => {
  describe('localizePath', () => {
    it('returns the path unchanged for the default locale (en)', () => {
      expect(localizePath('/bosses', 'en')).toBe('/bosses');
      expect(localizePath('/bosses/emberfang', 'en')).toBe('/bosses/emberfang');
    });

    it('prepends the locale prefix for non-default locales', () => {
      expect(localizePath('/bosses', nonDefaultLocale)).toBe('/ja/bosses');
      expect(localizePath('/bosses/emberfang', nonDefaultLocale)).toBe('/ja/bosses/emberfang');
    });

    it('ensures leading slash on input without one', () => {
      expect(localizePath('about', 'en')).toBe('/about');
      expect(localizePath('about', nonDefaultLocale)).toBe('/ja/about');
    });
  });

  describe('homeUrl', () => {
    it('returns / for default locale', () => {
      expect(homeUrl('en')).toBe('/');
    });
    it('returns /ja for non-default locale', () => {
      expect(homeUrl(nonDefaultLocale)).toBe('/ja');
    });
  });

  describe('listPath', () => {
    it('builds the correct list URL for each locale', () => {
      expect(listPath('bosses', 'en')).toBe('/bosses');
      expect(listPath('bosses', nonDefaultLocale)).toBe('/ja/bosses');
      expect(listPath('codes', 'en')).toBe('/codes');
    });
  });

  describe('detailPath', () => {
    it('builds the correct article URL for each locale', () => {
      expect(detailPath('bosses', 'emberfang', 'en')).toBe('/bosses/emberfang');
      expect(detailPath('bosses', 'emberfang', nonDefaultLocale)).toBe('/ja/bosses/emberfang');
    });

    it('handles nested slugs', () => {
      expect(detailPath('guides', 'early-game/beginner', 'en')).toBe('/guides/early-game/beginner');
      expect(detailPath('guides', 'early-game/beginner', nonDefaultLocale)).toBe(
        '/ja/guides/early-game/beginner',
      );
    });
  });
});

describe('slugifyTag (CJK / non-ASCII fallback)', () => {
  it('slugifies ASCII tags to lowercase kebab-case', () => {
    expect(slugifyTag('Boss Guide')).toBe('boss-guide');
    expect(slugifyTag('Fire_Warden')).toBe('fire-warden');
  });

  it('returns CJK tags raw instead of collapsing to empty', () => {
    // The ASCII branch strips every CJK char → '' → all such tags would
    // collide on /tags/. The raw fallback keeps them unique; Astro writes
    // params to disk verbatim, so the built directory is the raw tag and
    // browser-encoded links (/tags/%E7%84%B0…) resolve to it.
    const zh = slugifyTag('焰牙');
    expect(zh).toBe('焰牙');
    expect(zh).not.toBe('');
  });

  it('keeps two different CJK tags distinguishable', () => {
    expect(slugifyTag('焰牙')).not.toBe(slugifyTag('风暴召唤者'));
  });

  it('keeps pure-symbol tags non-empty', () => {
    // Whatever the exact characters, the slug is stable and distinct from ''
    // — the property the fallback exists to guarantee.
    expect(slugifyTag('!!!')).toBe('!!!');
    expect(slugifyTag('  ???  ')).toBe('???');
  });
});

describe('absoluteUrl', () => {
  it('prefixes siteUrl and applies the locale prefix rules', () => {
    expect(absoluteUrl('/bosses', 'en')).toMatch(/^https:\/\/[^/]+\/bosses$/);
    expect(absoluteUrl('/bosses', nonDefaultLocale)).toMatch(/^https:\/\/[^/]+\/ja\/bosses$/);
    expect(absoluteUrl('/', nonDefaultLocale)).toMatch(/^https:\/\/[^/]+\/ja$/);
  });
});

describe('languageAlternates', () => {
  it('builds absolute hreflang entries for exactly the given locales', () => {
    const alts = languageAlternates(
      (loc) => detailPath('bosses', 'x', loc),
      ['en', nonDefaultLocale],
    );
    expect(alts).toHaveLength(2);
    expect(alts[0]).toEqual({ hreflang: 'en', href: expect.stringMatching(/\/bosses\/x$/) });
    expect(alts[1]).toEqual({ hreflang: 'ja', href: expect.stringMatching(/\/ja\/bosses\/x$/) });
  });

  it('never emits x-default (BaseLayout derives it separately)', () => {
    const alts = languageAlternates((loc) => listPath('guides', loc), ['en', nonDefaultLocale]);
    expect(alts.some((a) => a.hreflang === 'x-default')).toBe(false);
  });

  it('honors a reduced locale list (single-language article)', () => {
    const alts = languageAlternates((loc) => detailPath('bosses', 'x', loc), [nonDefaultLocale]);
    expect(alts).toHaveLength(1);
    expect(alts[0].hreflang).toBe('ja');
  });
});
