import { FALLBACK_LOCALE, localeChain, type Locale } from '@/constants/locales';
import { AppError, NotFoundError } from '@/lib/errors';
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  sql,
  type SQLWrapper,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '..';
import { categories, categoryTranslations } from '../schema';
import { escapeLikePattern, localizedColumn, resolvedLocaleColumn } from '../translation-sql';
import type {
  AdminCategory,
  Category,
  CategoryListOptions,
  CategoryPage,
  CategorySortField,
  CategoryTranslation,
  LocalizedCategory,
} from './types';

const categoryTranslation = alias(categoryTranslations, 'category_translation');
const categoryTranslationFallback = alias(categoryTranslations, 'category_translation_fallback');

/** The category name in the requested locale, or in the fallback locale. */
const categoryName = () =>
  localizedColumn<string | null>(categoryTranslation.name, categoryTranslationFallback.name);

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const SORT_FIELDS: Record<CategorySortField, SQLWrapper> = {
  name: sql`coalesce(${categoryTranslation.name}, ${categoryTranslationFallback.name})`,
  createdAt: categories.createdAt,
};

const normalizePaging = (options: CategoryListOptions = {}) => {
  const pageSize = Math.min(
    Math.max(Math.trunc(options.pageSize ?? DEFAULT_PAGE_SIZE), 1),
    MAX_PAGE_SIZE
  );
  const page = Math.max(Math.trunc(options.page ?? 1), 1);
  return { page, pageSize };
};

/**
 * Case-insensitive match against the translated name of the requested locale and of the fallback
 * locale, so a search always covers what the user can see.
 */
const matchesSearch = (term: string, locale: Locale) =>
  exists(
    db
      .select({ found: sql`1` })
      .from(categoryTranslations)
      .where(
        and(
          eq(categoryTranslations.categoryId, categories.id),
          inArray(categoryTranslations.locale, localeChain(locale)),
          ilike(categoryTranslations.name, escapeLikePattern(term))
        )
      )
  );

const selectCategories = (locale: Locale, id?: string, options: CategoryListOptions = {}) => {
  const { page, pageSize } = normalizePaging(options);
  const term = options.search?.trim();
  const sort = SORT_FIELDS[options.sort ?? 'name'] ?? SORT_FIELDS.name;
  const direction = options.order === 'desc' ? desc : asc;
  const query = db
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
    .where(
      and(id ? eq(categories.id, id) : undefined, term ? matchesSearch(term, locale) : undefined)
    )
    // Default: alphabetical by the localized name, as before the translation tables existed.
    .orderBy(direction(sort), asc(categories.slug));

  // Pagination is only applied when explicitly requested (public/read paths stay unbounded).
  return options.page !== undefined || options.pageSize !== undefined
    ? query.limit(pageSize).offset((page - 1) * pageSize)
    : query;
};

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

const countCategories = async (locale: Locale, search?: string): Promise<number> => {
  const term = search?.trim();
  const [row] = await db
    .select({ value: count() })
    .from(categories)
    .where(term ? matchesSearch(term, locale) : undefined);
  return row?.value ?? 0;
};

/** Second stage of the admin list: attach every translation of the page's categories. */
const attachTranslations = async (rows: LocalizedCategory[]): Promise<AdminCategory[]> => {
  const grouped = new Map<string, CategoryTranslation[]>();
  const ids = rows.map((row) => row.id);

  if (ids.length > 0) {
    const translations = await db
      .select()
      .from(categoryTranslations)
      .where(inArray(categoryTranslations.categoryId, ids))
      .orderBy(asc(categoryTranslations.locale));

    for (const translation of translations) {
      const list = grouped.get(translation.categoryId) ?? [];
      list.push(translation);
      grouped.set(translation.categoryId, list);
    }
  }

  return rows.map((category) => ({
    ...category,
    translations: grouped.get(category.id) ?? [],
  }));
};

/**
 * Paginated, filterable, sortable admin category list. Every page item carries the full, unresolved
 * translation list so the admin can edit in place.
 */
export const listCategoriesForAdmin = async (
  locale: Locale,
  options: CategoryListOptions = {}
): Promise<CategoryPage> => {
  'use cache';
  cacheLife('days');
  cacheTag('categories');
  const { page, pageSize } = normalizePaging(options);
  try {
    const [rows, total] = await Promise.all([
      selectCategories(locale, undefined, { ...options, page, pageSize }),
      countCategories(locale, options.search),
    ]);
    return {
      items: await attachTranslations(rows.map(toLocalizedCategory)),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    };
  } catch (error) {
    throw new AppError('CATEGORY_FETCH_FAILED', { cause: error });
  }
};
