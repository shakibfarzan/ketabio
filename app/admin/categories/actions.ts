'use server';

import { createCategory, deleteCategory, updateCategory } from '@/db/categories';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters.').max(100),
});

const parseCategory = (formData: FormData) =>
  categorySchema.safeParse({ name: formData.get('name') });

export const createCategoryAction = async (formData: FormData) => {
  const parsed = parseCategory(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await createCategory(parsed.data.name);
  revalidatePath('/admin/categories');
  return { error: null };
};

export const updateCategoryAction = async (id: string, formData: FormData) => {
  const parsed = parseCategory(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await updateCategory(id, parsed.data.name);
  revalidatePath('/admin/categories');
  return { error: null };
};

export const deleteCategoryAction = async (formData: FormData) => {
  const id = formData.get('id');
  if (typeof id !== 'string' || !z.uuid().safeParse(id).success) return;

  await deleteCategory(id);
  revalidatePath('/admin/categories');
};
