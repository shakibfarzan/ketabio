import { localeChain, type Locale } from '@/constants/locales';

/**
 * Locale resolution for dynamic content.
 *
 * Most callers never need this: `db/*` resolves translations inside the query and returns flat,
 * already-localized objects (`LocalizedBook`, `LocalizedAuthor`, `LocalizedCategory`). These
 * helpers exist for the cases where a full translation list is in hand — the edit forms, which
 * show every locale at once, and tests.
 *
 * Pure module: no `next-intl`, no database, safe to import from client components.
 */

export type HasLocale = { locale: Locale };

/**
 * Picks the translation to display: requested locale → fallback locale → whatever exists first.
 * Returns `undefined` only when the entity has no translations at all.
 */
export const resolveTranslation = <T extends HasLocale>(
  translations: readonly T[],
  locale: Locale
): T | undefined => {
  for (const candidate of localeChain(locale)) {
    const match = translations.find((translation) => translation.locale === candidate);
    if (match) return match;
  }
  return translations[0];
};

/** Indexes a translation list by locale, e.g. to prefill a per-locale edit form. */
export const translationsByLocale = <T extends HasLocale>(
  translations: readonly T[]
): Partial<Record<Locale, T>> => {
  const indexed: Partial<Record<Locale, T>> = {};
  for (const translation of translations) indexed[translation.locale] = translation;
  return indexed;
};
