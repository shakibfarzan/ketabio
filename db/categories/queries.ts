import { FALLBACK_LOCALE, type Locale } from '@/constants/locales';
import { AppError, NotFoundError } from '@/lib/errors';
import { and, asc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '..';
import { categories, categoryTranslations } from '../schema';
import { localizedColumn, resolvedLocaleColumn } from '../translation-sql';
import type { AdminCategory, Category, CategoryTranslation, LocalizedCategory } from './types';

const categoryTranslation = alias(categoryTranslations, 'category_translation');
const categoryTranslationFallback = alias(categoryTranslations, 'category_translation_fallback');

/** The category name in the requested locale, or in the fallback locale. */
const categoryName = () =>
  localizedColumn<string | null>(categoryTranslation.name, categoryTranslationFallback.name);

const selectCategories = (locale: Locale, id?: string) =>
  db
    .select({
      id: categories.id,
      slug: categories.slug,
      createdAt: categories.createdAt,
      name: categoryName(),
      locale: resolvedLocaleColumn(categoryTranslation.id, categoryTranslationFallback.id, locale),
    })
    .from(categories)
    .leftJoin(
      categoryTranslation,
      and(eq(categoryTranslation.categoryId, categories.id), eq(categoryTranslation.locale, locale))
    )
    .leftJoin(
      categoryTranslationFallback,
      and(
        eq(categoryTranslationFallback.categoryId, categories.id),
        eq(categoryTranslationFallback.locale, FALLBACK_LOCALE)
      )
    )
    .where(id ? eq(categories.id, id) : undefined)
    // Alphabetical by the localized name, as before the translation tables existed.
    .orderBy(asc(sql`coalesce(${categoryTranslation.name}, ${categoryTranslationFallback.name})`));

const toLocalizedCategory = (row: Awaited<ReturnType<typeof selectCategories>>[number]) =>
  ({ ...row, name: row.name ?? '' }) satisfies LocalizedCategory;

/**
 * All categories with their name in `locale` (falling back to English).
 * Cached per locale — `locale` is part of the cache key.
 */
export const listCategories = async (locale: Locale): Promise<LocalizedCategory[]> => {
  'use cache';
  cacheLife('days');
  cacheTag('categories');
  try {
    return (await selectCategories(locale)).map(toLocalizedCategory);
  } catch (error) {
    throw new AppError('CATEGORY_FETCH_FAILED', { cause: error });
  }
};

export const getCategoryById = async (id: string, locale: Locale): Promise<LocalizedCategory> => {
  let rows: Awaited<ReturnType<typeof selectCategories>>;
  try {
    rows = await selectCategories(locale, id);
  } catch (error) {
    throw new AppError('CATEGORY_FETCH_FAILED', { cause: error });
  }
  const category = rows[0];
  if (!category) throw new NotFoundError('CATEGORY_NOT_FOUND');
  return toLocalizedCategory(category);
};

/** Full, unresolved translation list — used by the edit form. */
export const getCategoryTranslations = async (
  categoryId: string
): Promise<CategoryTranslation[]> => {
  try {
    return await db
      .select()
      .from(categoryTranslations)
      .where(eq(categoryTranslations.categoryId, categoryId))
      .orderBy(asc(categoryTranslations.locale));
  } catch (error) {
    throw new AppError('CATEGORY_FETCH_FAILED', { cause: error });
  }
};

/** Language-independent row, for the write path (no locale needed to check existence). */
export const getCategoryRow = async (id: string): Promise<Category> => {
  let category: Category | undefined;
  try {
    category = await db.query.categories.findFirst({ where: eq(categories.id, id) });
  } catch (error) {
    throw new AppError('CATEGORY_FETCH_FAILED', { cause: error });
  }
  if (!category) throw new NotFoundError('CATEGORY_NOT_FOUND');
  return category;
};

/** A category plus every one of its translations — what the admin manager needs to edit in place. */
export const listCategoriesForAdmin = async (locale: Locale): Promise<AdminCategory[]> => {
  'use cache';
  cacheLife('days');
  cacheTag('categories');

  const [rows, translations] = await Promise.all([
    listCategories(locale),
    db.select().from(categoryTranslations).orderBy(asc(categoryTranslations.locale)),
  ]);

  const grouped = new Map<string, CategoryTranslation[]>();
  for (const translation of translations) {
    const list = grouped.get(translation.categoryId) ?? [];
    list.push(translation);
    grouped.set(translation.categoryId, list);
  }

  return rows.map((category) => ({
    ...category,
    translations: grouped.get(category.id) ?? [],
  }));
};
