import { FALLBACK_LOCALE, LOCALES } from '@/constants/locales';
import { AppError, ConflictError, isForeignKeyViolation, isUniqueViolation } from '@/lib/errors';
import slugify from '@/utils/slugify';
import { eq, sql } from 'drizzle-orm';
import { db } from '..';
import { bookTranslations, books } from '../schema';
import { BOOKS_CONSTRAINTS } from './constants';
import type { BookTranslationInsert, BookTranslationsInput } from './types';

export const uniqueSlug = async (title: string, excludedId?: string) => {
  const baseSlug = slugify(title) || 'book';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.query.books.findFirst({
      columns: { id: true },
      where: eq(books.slug, slug),
    });

    if (!existing || existing.id === excludedId) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
};

/**
 * Title the canonical slug is generated from.
 *
 * Slugs stay language-independent (`books.slug`), so the fallback locale's title is the stable
 * source — a Persian-only title would slugify to nothing (`utils/slugify.ts` is Latin-only).
 */
export const primaryTitle = (translations: BookTranslationsInput): string => {
  const fallbackTitle = translations[FALLBACK_LOCALE]?.title;
  if (fallbackTitle) return fallbackTitle;

  for (const locale of LOCALES) {
    const title = translations[locale]?.title;
    if (title) return title;
  }

  return 'book';
};

/** `{ en: {…}, fa: {…} }` → insertable rows, skipping locales that carry no title. */
export const toTranslationRows = (
  bookId: string,
  translations: BookTranslationsInput
): BookTranslationInsert[] =>
  LOCALES.flatMap((locale) => {
    const value = translations[locale];
    if (!value?.title) return [];
    return [{ bookId, locale, title: value.title, description: value.description ?? null }];
  });

/**
 * One upsert per locale.
 *
 * `ON CONFLICT (book_id, locale) DO UPDATE` makes "create then edit" a single code path and makes a
 * duplicate `(book_id, locale)` impossible to write. `description` is only overwritten when the
 * caller actually supplied one, so a title-only edit cannot wipe an existing description.
 */
export const translationUpserts = (bookId: string, translations: BookTranslationsInput) =>
  toTranslationRows(bookId, translations).map((row) =>
    db
      .insert(bookTranslations)
      .values(row)
      .onConflictDoUpdate({
        target: [bookTranslations.bookId, bookTranslations.locale],
        set: {
          title: sql`excluded.title`,
          ...(row.description === null ? {} : { description: sql`excluded.description` }),
        },
      })
  );

/**
 * Maps write-time constraint violations shared by create/update to application errors.
 * Returns `null` when the error is not a recognised constraint violation.
 */
export const mapBookWriteError = (error: unknown): AppError | null => {
  if (isUniqueViolation(error, BOOKS_CONSTRAINTS.BOOKS_SLUG_UNIQUE)) {
    return new ConflictError('BOOK_SLUG_EXISTS', {
      cause: error,
      fields: { slug: 'BOOK_SLUG_EXISTS' },
    });
  }
  if (isForeignKeyViolation(error, BOOKS_CONSTRAINTS.BOOKS_AUTHOR_FK)) {
    return new AppError('VALIDATION_ERROR', { cause: error, fields: { authorId: 'INVALID' } });
  }
  if (isForeignKeyViolation(error, BOOKS_CONSTRAINTS.BOOK_CATEGORIES_CATEGORY_FK)) {
    return new AppError('VALIDATION_ERROR', {
      cause: error,
      fields: { categoriesIds: 'INVALID' },
    });
  }
  return null;
};
