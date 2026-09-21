import { AppError } from '@/lib/errors';
import type { BatchItem } from 'drizzle-orm/batch';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '..';
import { bookCategories, categories } from '../schema';
import { mapCategoryWriteError, primaryName, translationUpserts, uniqueSlug } from './helpers';
import { getCategoryRow } from './queries';
import { Category, CategoryTranslationsInput } from './types';

/**
 * Category writes.
 *
 * A category and its translations are written in one `batch()` — the atomic primitive of the
 * `neon-http` driver — so a category can never exist without a translatable name.
 */

export const createCategory = async (
  translations: CategoryTranslationsInput
): Promise<Category> => {
  try {
    const slug = await uniqueSlug(primaryName(translations));
    const id = randomUUID();

    const statements: [BatchItem<'pg'>, ...BatchItem<'pg'>[]] = [
      db.insert(categories).values({ id, slug }).returning(),
    ];
    statements.push(...translationUpserts(id, translations));

    const [created] = await db.batch(statements);
    return (created as Category[])[0];
  } catch (error) {
    throw mapCategoryWriteError(error) ?? new AppError('CATEGORY_CREATE_FAILED', { cause: error });
  }
};

export const updateCategory = async (
  id: string,
  translations: CategoryTranslationsInput
): Promise<Category> => {
  await getCategoryRow(id); // -> CATEGORY_NOT_FOUND

  try {
    const slug = await uniqueSlug(primaryName(translations), id);

    const statements: [BatchItem<'pg'>, ...BatchItem<'pg'>[]] = [
      db.update(categories).set({ slug }).where(eq(categories.id, id)).returning(),
    ];
    statements.push(...translationUpserts(id, translations));

    const [updated] = await db.batch(statements);
    return (updated as Category[])[0];
  } catch (error) {
    throw mapCategoryWriteError(error) ?? new AppError('CATEGORY_UPDATE_FAILED', { cause: error });
  }
};

export const deleteCategory = async (id: string): Promise<Category> => {
  await getCategoryRow(id); // -> CATEGORY_NOT_FOUND

  try {
    // Category removal intentionally also removes its book associations;
    // category_translations is removed by ON DELETE CASCADE.
    const [, deletedCategories] = await db.batch([
      db.delete(bookCategories).where(eq(bookCategories.categoryId, id)),
      db.delete(categories).where(eq(categories.id, id)).returning(),
    ]);
    return deletedCategories[0];
  } catch (error) {
    throw new AppError('CATEGORY_DELETE_FAILED', { cause: error });
  }
};
