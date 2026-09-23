'use server';

import { LOCALES, type Locale } from '@/constants/locales';
import { parseDataTableParams } from '@/components/data-table/data-table-params';
import {
  createCategory,
  deleteCategory,
  listCategoriesForAdmin,
  updateCategory,
} from '@/db/categories';
import type { CategoryListOptions, CategoryPage } from '@/db/categories/types';
import requireAdmin from '@/lib/auth/require-admin';
import { AppError } from '@/lib/errors';
import { getRequestLocale } from '@/lib/request-locale';
import { categoryListOptionsSchema } from '@/lib/validators/category.schema';
import safeAction from '@/utils/safe-action';
import { getTranslations } from 'next-intl/server';
import { updateTag } from 'next/cache';
import { z } from 'zod';
import { categorySchema } from './form-schemas';

/** `translations.en.name`, `translations.fa.name`, … → `{ en: { name }, fa: { name } }`. */
const parseCategory = async (formData: FormData) => {
  const tForms = await getTranslations('Forms');
  const translations = Object.fromEntries(
    LOCALES.map((locale) => {
      const name = formData.get(`translations.${locale}.name`);
      return [locale, { name: typeof name === 'string' ? name : '' }];
    })
  ) as Record<Locale, { name: string }>;

  return categorySchema(tForms).safeParse({ translations });
};

export const createCategoryAction = async (formData: FormData) => {
  const parsed = await parseCategory(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return safeAction(async () => {
    await createCategory(parsed.data.translations);
    updateTag('categories');
  });
};

export const updateCategoryAction = async (id: string, formData: FormData) => {
  const parsed = await parseCategory(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return safeAction(async () => {
    await updateCategory(id, parsed.data.translations);
    updateTag('categories');
  });
};

export const deleteCategoryAction = async (formData: FormData) => {
  const id = formData.get('id');
  if (typeof id !== 'string' || !z.uuid().safeParse(id).success) return;
  return safeAction(async () => {
    await deleteCategory(id);
    updateTag('categories');
  });
};

/**
 * Paginated admin category list. Every option is serialized by the DataTable into the URL
 * (`q`, `sort`, `dir`, `page`, `pageSize`), parsed back here through `parseDataTableParams`,
 * then mapped to the domain options. Validates everything (stable `VALIDATION_ERROR` code on bad
 * input), enforces an admin session, and returns already-localized categories plus their full
 * translations for in-place editing.
 */
export const listCategoriesAction = async (
  input: Readonly<Record<string, string | string[] | undefined>> = {}
) =>
  safeAction(async (): Promise<CategoryPage> => {
    const tableParams = parseDataTableParams(input);
    const options: CategoryListOptions = {
      ...(tableParams.search ? { search: tableParams.search } : {}),
      ...(tableParams.sort
        ? {
            sort: tableParams.sort.id === 'createdAt' ? 'createdAt' : 'name',
            order: tableParams.sort.dir,
          }
        : {}),
      page: tableParams.page,
      pageSize: tableParams.pageSize,
    };
    const parsedInput = categoryListOptionsSchema.safeParse(options);
    if (!parsedInput.success) throw new AppError('VALIDATION_ERROR');
    await requireAdmin();
    const locale = await getRequestLocale();

    return listCategoriesForAdmin(locale, parsedInput.data);
  });
