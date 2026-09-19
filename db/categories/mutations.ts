import { AppError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { db } from '..';
import { bookCategories, categories } from '../schema';
import { mapCategoryWriteError, uniqueSlug } from './helpers';
import { getCategoryById } from './queries';
import { Category, CategoryInsert } from './types';

export const createCategory = async (name: string): Promise<Category> => {
  try {
    const slug = await uniqueSlug(name);
    const [created] = await db
      .insert(categories)
      .values({ name, slug } satisfies CategoryInsert)
      .returning();
    return created;
  } catch (error) {
    throw mapCategoryWriteError(error) ?? new AppError('CATEGORY_CREATE_FAILED', { cause: error });
  }
};

export const updateCategory = async (id: string, name: string): Promise<Category> => {
  await getCategoryById(id); // -> CATEGORY_NOT_FOUND

  try {
    const slug = await uniqueSlug(name, id);
    const [updated] = await db
      .update(categories)
      .set({ name, slug })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  } catch (error) {
    throw mapCategoryWriteError(error) ?? new AppError('CATEGORY_UPDATE_FAILED', { cause: error });
  }
};

export const deleteCategory = async (id: string): Promise<Category> => {
  await getCategoryById(id); // -> CATEGORY_NOT_FOUND

  try {
    // Category removal intentionally also removes its book associations.
    const [, deletedCategories] = await db.batch([
      db.delete(bookCategories).where(eq(bookCategories.categoryId, id)),
      db.delete(categories).where(eq(categories.id, id)).returning(),
    ]);
    return deletedCategories[0];
  } catch (error) {
    throw new AppError('CATEGORY_DELETE_FAILED', { cause: error });
  }
};
