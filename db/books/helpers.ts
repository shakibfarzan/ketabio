import { AppError, ConflictError, isForeignKeyViolation, isUniqueViolation } from '@/lib/errors';
import slugify from '@/utils/slugify';
import { eq } from 'drizzle-orm';
import { db } from '..';
import { books } from '../schema';
import { BOOKS_CONSTRAINTS } from './constants';

export const uniqueSlug = async (title: string, excludedId?: string) => {
  const baseSlug = slugify(title) || 'book';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.query.books.findFirst({
      columns: { id: true },
      where: eq(books.slug, slug),
    });

    if (!existing || existing.id === excludedId) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
};

/**
 * Maps write-time constraint violations shared by create/update to application errors.
 * Returns `null` when the error is not a recognised constraint violation.
 */
export const mapBookWriteError = (error: unknown): AppError | null => {
  if (isUniqueViolation(error, BOOKS_CONSTRAINTS.BOOKS_SLUG_UNIQUE)) {
    return new ConflictError('BOOK_SLUG_EXISTS', {
      cause: error,
      fields: { slug: 'BOOK_SLUG_EXISTS' },
    });
  }
  if (isForeignKeyViolation(error, BOOKS_CONSTRAINTS.BOOKS_AUTHOR_FK)) {
    return new AppError('VALIDATION_ERROR', { cause: error, fields: { authorId: 'INVALID' } });
  }
  if (isForeignKeyViolation(error, BOOKS_CONSTRAINTS.BOOK_CATEGORIES_CATEGORY_FK)) {
    return new AppError('VALIDATION_ERROR', {
      cause: error,
      fields: { categoriesIds: 'INVALID' },
    });
  }
  return null;
};
