import { FALLBACK_LOCALE, LOCALES } from '@/constants/locales';
import { AppError, ConflictError, isUniqueViolation } from '@/lib/errors';
import slugify from '@/utils/slugify';
import { eq, sql } from 'drizzle-orm';
import { db } from '..';
import { authors, authorTranslations } from '../schema';
import { AUTHORS_CONSTRAINTS } from './constants';
import type { AuthorTranslationInsert, AuthorTranslationsInput } from './types';

export const uniqueSlug = async (name: string, excludedId?: string) => {
  const baseSlug = slugify(name) || 'author';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.query.authors.findFirst({
      columns: { id: true },
      where: eq(authors.slug, slug),
    });

    if (!existing || existing.id === excludedId) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
};

/** Name the canonical slug is generated from (fallback locale first, then any provided locale). */
export const primaryName = (translations: AuthorTranslationsInput): string => {
  const fallbackName = translations[FALLBACK_LOCALE]?.name;
  if (fallbackName) return fallbackName;

  for (const locale of LOCALES) {
    const name = translations[locale]?.name;
    if (name) return name;
  }

  return 'author';
};

/** `{ en: {…}, fa: {…} }` → insertable rows, skipping locales that carry no name. */
export const toTranslationRows = (
  authorId: string,
  translations: AuthorTranslationsInput
): AuthorTranslationInsert[] =>
  LOCALES.flatMap((locale) => {
    const value = translations[locale];
    if (!value?.name) return [];
    return [{ authorId, locale, name: value.name, bio: value.bio ?? null }];
  });

/** One upsert per locale, so editing an author never creates duplicate `(author_id, locale)` rows. */
export const translationUpserts = (authorId: string, translations: AuthorTranslationsInput) =>
  toTranslationRows(authorId, translations).map((row) =>
    db
      .insert(authorTranslations)
      .values(row)
      .onConflictDoUpdate({
        target: [authorTranslations.authorId, authorTranslations.locale],
        set: { name: sql`excluded.name`, bio: sql`excluded.bio` },
      })
  );

/** Maps write-time constraint violations shared by create/update to application errors. */
export const mapAuthorWriteError = (error: unknown): AppError | null => {
  if (isUniqueViolation(error, AUTHORS_CONSTRAINTS.AUTHORS_SLUG_UNIQUE)) {
    return new ConflictError('AUTHOR_SLUG_EXISTS', { cause: error });
  }
  return null;
};
