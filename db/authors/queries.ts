import { FALLBACK_LOCALE, type Locale } from '@/constants/locales';
import { AppError, NotFoundError } from '@/lib/errors';
import { and, asc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '..';
import { authorTranslations, authors } from '../schema';
import { localizedColumn, resolvedLocaleColumn } from '../translation-sql';
import type { AuthorTranslation, LocalizedAuthor } from './types';

const authorTranslation = alias(authorTranslations, 'author_translation');
const authorTranslationFallback = alias(authorTranslations, 'author_translation_fallback');

const selectAuthors = (locale: Locale, id?: string) =>
  db
    .select({
      id: authors.id,
      slug: authors.slug,
      avatarUrl: authors.avatarUrl,
      createdAt: authors.createdAt,
      name: localizedColumn<string | null>(authorTranslation.name, authorTranslationFallback.name),
      locale: resolvedLocaleColumn(authorTranslation.id, authorTranslationFallback.id, locale),
    })
    .from(authors)
    .leftJoin(
      authorTranslation,
      and(eq(authorTranslation.authorId, authors.id), eq(authorTranslation.locale, locale))
    )
    .leftJoin(
      authorTranslationFallback,
      and(
        eq(authorTranslationFallback.authorId, authors.id),
        eq(authorTranslationFallback.locale, FALLBACK_LOCALE)
      )
    )
    .where(id ? eq(authors.id, id) : undefined)
    .orderBy(asc(authorTranslation.name), asc(authorTranslationFallback.name));

const toLocalizedAuthor = (row: Awaited<ReturnType<typeof selectAuthors>>[number]) =>
  ({ ...row, name: row.name ?? '' }) satisfies LocalizedAuthor;

/** All authors with their name in `locale` (falling back to English). */
export const listAuthors = async (locale: Locale): Promise<LocalizedAuthor[]> => {
  try {
    return (await selectAuthors(locale)).map(toLocalizedAuthor);
  } catch (error) {
    throw new AppError('AUTHOR_FETCH_FAILED', { cause: error });
  }
};

export const getAuthorById = async (id: string, locale: Locale): Promise<LocalizedAuthor> => {
  let rows: Awaited<ReturnType<typeof selectAuthors>>;
  try {
    rows = await selectAuthors(locale, id);
  } catch (error) {
    throw new AppError('AUTHOR_FETCH_FAILED', { cause: error });
  }
  const author = rows[0];
  if (!author) throw new NotFoundError('AUTHOR_NOT_FOUND');
  return toLocalizedAuthor(author);
};

/** Full, unresolved translation list — used by an edit form. */
export const getAuthorTranslations = async (authorId: string): Promise<AuthorTranslation[]> => {
  try {
    return await db
      .select()
      .from(authorTranslations)
      .where(eq(authorTranslations.authorId, authorId))
      .orderBy(asc(authorTranslations.locale));
  } catch (error) {
    throw new AppError('AUTHOR_FETCH_FAILED', { cause: error });
  }
};
