import { AppError, NotFoundError } from '@/lib/errors';
import { asc, eq } from 'drizzle-orm';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '..';
import { categories } from '../schema';
import { Category } from './types';

export const listCategories = async (): Promise<Category[]> => {
  'use cache';
  cacheLife('days');
  cacheTag('categories');
  try {
    return await db.select().from(categories).orderBy(asc(categories.name));
  } catch (error) {
    throw new AppError('CATEGORY_FETCH_FAILED', { cause: error });
  }
};

export const getCategoryById = async (id: string): Promise<Category> => {
  let category: Category | undefined;
  try {
    category = await db.query.categories.findFirst({ where: eq(categories.id, id) });
  } catch (error) {
    throw new AppError('CATEGORY_FETCH_FAILED', { cause: error });
  }
  if (!category) throw new NotFoundError('CATEGORY_NOT_FOUND');
  return category;
};
