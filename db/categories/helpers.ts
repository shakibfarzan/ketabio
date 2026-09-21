import { FALLBACK_LOCALE, LOCALES } from '@/constants/locales';
import { AppError, ConflictError, isUniqueViolation } from '@/lib/errors';
import slugify from '@/utils/slugify';
import { eq, sql } from 'drizzle-orm';
import { db } from '..';
import { categories, categoryTranslations } from '../schema';
import { CATEGORIES_CONSTRAINTS } from './constants';
import type { CategoryTranslationInsert, CategoryTranslationsInput } from './types';

export const uniqueSlug = async (name: string, excludedId?: string) => {
  const baseSlug = slugify(name) || 'category';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.query.categories.findFirst({
      columns: { id: true },
      where: eq(categories.slug, slug),
    });

    if (!existing || existing.id === excludedId) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
};

/** Name the canonical slug is generated from (fallback locale first, then any provided locale). */
export const primaryName = (translations: CategoryTranslationsInput): string => {
  const fallbackName = translations[FALLBACK_LOCALE]?.name;
  if (fallbackName) return fallbackName;

  for (const locale of LOCALES) {
    const name = translations[locale]?.name;
    if (name) return name;
  }

  return 'category';
};

/** `{ en: {…}, fa: {…} }` → insertable rows, skipping locales that carry no name. */
export const toTranslationRows = (
  categoryId: string,
  translations: CategoryTranslationsInput
): CategoryTranslationInsert[] =>
  LOCALES.flatMap((locale) => {
    const value = translations[locale];
    if (!value?.name) return [];
    return [{ categoryId, locale, name: value.name }];
  });

/** One upsert per locale, so editing a category never creates duplicate `(category_id, locale)` rows. */
export const translationUpserts = (categoryId: string, translations: CategoryTranslationsInput) =>
  toTranslationRows(categoryId, translations).map((row) =>
    db
      .insert(categoryTranslations)
      .values(row)
      .onConflictDoUpdate({
        target: [categoryTranslations.categoryId, categoryTranslations.locale],
        set: { name: sql`excluded.name` },
      })
  );

/** Maps write-time constraint violations shared by create/update to application errors. */
export const mapCategoryWriteError = (error: unknown): AppError | null => {
  // A category name is unique per locale; the violated row's locale is not reported by PostgreSQL,
  // so the conflict is surfaced as a summary rather than on one specific input.
  if (isUniqueViolation(error, CATEGORIES_CONSTRAINTS.CATEGORY_TRANSLATIONS_NAME_UNIQUE)) {
    return new ConflictError('CATEGORY_NAME_EXISTS', { cause: error });
  }
  if (isUniqueViolation(error, CATEGORIES_CONSTRAINTS.CATEGORIES_SLUG_UNIQUE)) {
    return new ConflictError('CATEGORY_SLUG_EXISTS', { cause: error });
  }
  return null;
};
