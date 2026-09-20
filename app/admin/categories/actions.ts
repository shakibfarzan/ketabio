'use server';

import { LOCALES, type Locale } from '@/constants/locales';
import { createCategory, deleteCategory, updateCategory } from '@/db/categories';
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
