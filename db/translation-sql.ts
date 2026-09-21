import { FALLBACK_LOCALE, type Locale } from '@/constants/locales';
import { sql, type SQL, type SQLWrapper } from 'drizzle-orm';

/**
 * SQL fragments shared by every localized query.
 *
 * A localized read joins the translation table twice — once for the requested locale, once for
 * the fallback locale — and collapses the pair with `COALESCE`. That keeps one row per entity
 * (so `LIMIT`/`OFFSET` pagination stays correct) and lets search/sort run on the value the user
 * actually sees.
 *
 * Fallback order is `requested locale → FALLBACK_LOCALE`, the same order `lib/localization.ts`
 * applies in memory.
 */

/** `COALESCE(requested.title, fallback.title)` — the requested locale wins, the fallback fills in. */
export const localizedColumn = <T>(requested: SQLWrapper, fallback: SQLWrapper): SQL<T> =>
  sql<T>`coalesce(${requested}, ${fallback})`;

/** Which locale the `localizedColumn` values above were resolved from (`null` when untranslated). */
export const resolvedLocaleColumn = (
  requestedId: SQLWrapper,
  fallbackId: SQLWrapper,
  locale: Locale
): SQL<Locale | null> =>
  sql<Locale | null>`case
    when ${requestedId} is not null then ${locale}::text
    when ${fallbackId} is not null then ${FALLBACK_LOCALE}::text
    else null
  end`;

/**
 * Escapes the LIKE wildcards (`%`, `_`, `\`) so user input is matched literally.
 * PostgreSQL's default LIKE escape character is the backslash.
 */
export const escapeLikePattern = (value: string): string =>
  `%${value.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
