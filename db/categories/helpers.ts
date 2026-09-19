import { AppError, ConflictError, isUniqueViolation } from '@/lib/errors';
import slugify from '@/utils/slugify';
import { eq } from 'drizzle-orm';
import { db } from '..';
import { categories } from '../schema';
import { CATEGORIES_CONSTRAINTS } from './constants';

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

/** Maps write-time constraint violations shared by create/update to application errors. */
export const mapCategoryWriteError = (error: unknown): AppError | null => {
  if (isUniqueViolation(error, CATEGORIES_CONSTRAINTS.CATEGORIES_NAME_UNIQUE)) {
    return new ConflictError('CATEGORY_NAME_EXISTS', {
      cause: error,
      fields: { name: 'CATEGORY_NAME_EXISTS' },
    });
  }
  if (isUniqueViolation(error, CATEGORIES_CONSTRAINTS.CATEGORIES_SLUG_UNIQUE)) {
    return new ConflictError('CATEGORY_SLUG_EXISTS', { cause: error });
  }
  return null;
};
