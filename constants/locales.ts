/**
 * Single source of truth for the locales Ketabio supports.
 *
 * Static UI copy is translated by `next-intl` from `messages/{locale}.json`; dynamic content
 * (books, authors, categories) is translated by the `*_translations` tables in `db/schema.ts`,
 * whose `locale` enum is generated from `LOCALES`.
 *
 * This module is dependency-free on purpose so it can be imported from the database layer,
 * Server Components, Server Actions and client components alike.
 *
 * To add a language: append it to `LOCALES`, add `messages/{locale}.json`, then run
 * `npm run migrate` (see `docs/I18N.md`).
 */
export const LOCALES = ['en', 'fa'] as const;

export type Locale = (typeof LOCALES)[number];

/** Locale assumed when the request does not carry a known one. */
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Locale used when content has no translation for the requested locale.
 * Every entity is required to have a translation in this locale.
 */
export const FALLBACK_LOCALE: Locale = DEFAULT_LOCALE;

/** Cookie read by `i18n/request.ts`, `app/layout.tsx` and `lib/request-locale.ts`. */
export const LOCALE_COOKIE = 'locale';

/** Human-readable names, used where a translated label is not available (e.g. seeds, logs). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fa: 'Persian',
};

/** Locales rendered right-to-left. */
export const RTL_LOCALES: readonly Locale[] = ['fa'];

export const isRtl = (locale: string): boolean =>
  (RTL_LOCALES as readonly string[]).includes(locale);

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

/** Narrows an arbitrary value to a `Locale`, falling back to `DEFAULT_LOCALE`. */
export const toLocale = (value: unknown): Locale => (isLocale(value) ? value : DEFAULT_LOCALE);

/** `[requested, FALLBACK_LOCALE]` without duplicates — the order translations are preferred in. */
export const localeChain = (locale: Locale): Locale[] =>
  locale === FALLBACK_LOCALE ? [FALLBACK_LOCALE] : [locale, FALLBACK_LOCALE];
