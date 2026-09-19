'use server';

import { createCategory, deleteCategory, updateCategory } from '@/db/categories';
import { getTranslations } from 'next-intl/server';
import { updateTag } from 'next/cache';
import { z } from 'zod';
import { categorySchema } from './form-schemas';

const parseCategory = async (formData: FormData) => {
  const tForms = await getTranslations('Forms');
  return categorySchema(tForms).safeParse({ name: formData.get('name') });
};

export const createCategoryAction = async (formData: FormData) => {
  const parsed = await parseCategory(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await createCategory(parsed.data.name);
  updateTag('categories');
  return { error: null };
};

export const updateCategoryAction = async (id: string, formData: FormData) => {
  const parsed = await parseCategory(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await updateCategory(id, parsed.data.name);
  updateTag('categories');
  return { error: null };
};

export const deleteCategoryAction = async (formData: FormData) => {
  const id = formData.get('id');
  if (typeof id !== 'string' || !z.uuid().safeParse(id).success) return;

  await deleteCategory(id);
  updateTag('categories');
};
