import { AppError, ConflictError, isForeignKeyViolation } from '@/lib/errors';
import { CreateBookInput, UpdateBookInput } from '@/lib/validators/book.schema';
import { eq } from 'drizzle-orm';
import { db } from '..';
import { bookCategories, bookFiles, books } from '../schema';
import { mapBookWriteError, uniqueSlug } from './helpers';
import { getBookById } from './queries';
import { Book, BookInsert } from './types';

export const createBook = async (input: CreateBookInput): Promise<Book> => {
  const { bookFiles: files, categoriesIds, slug: requestedSlug, ...data } = input;

  try {
    // An explicit slug must be respected (conflict -> BOOK_SLUG_EXISTS);
    // a generated one is made unique up-front.
    const slug = requestedSlug ?? (await uniqueSlug(data.title));

    const [created] = await db
      .insert(books)
      .values({ ...data, slug } satisfies BookInsert)
      .returning();

    await db
      .insert(bookCategories)
      .values(categoriesIds.map((categoryId) => ({ bookId: created.id, categoryId })));

    await db.insert(bookFiles).values(files.map((file) => ({ ...file, bookId: created.id })));

    return created;
  } catch (error) {
    throw mapBookWriteError(error) ?? new AppError('BOOK_CREATE_FAILED', { cause: error });
  }
};

export const updateBook = async (id: string, input: UpdateBookInput): Promise<Book> => {
  await getBookById(id); // -> BOOK_NOT_FOUND

  const { categoriesIds, ...data } = input;

  try {
    const [updated] = await db.update(books).set(data).where(eq(books.id, id)).returning();

    if (categoriesIds) {
      await db.delete(bookCategories).where(eq(bookCategories.bookId, id));
      await db
        .insert(bookCategories)
        .values(categoriesIds.map((categoryId) => ({ bookId: id, categoryId })));
    }

    return updated;
  } catch (error) {
    throw mapBookWriteError(error) ?? new AppError('BOOK_UPDATE_FAILED', { cause: error });
  }
};

export const deleteBook = async (id: string): Promise<Book> => {
  await getBookById(id); // -> BOOK_NOT_FOUND

  try {
    // book_categories has no ON DELETE CASCADE; book_files does.
    await db.delete(bookCategories).where(eq(bookCategories.bookId, id));
    const [deleted] = await db.delete(books).where(eq(books.id, id)).returning();
    return deleted;
  } catch (error) {
    // Still referenced by shelves, reviews, favorites or reading progress.
    if (isForeignKeyViolation(error)) {
      throw new ConflictError('BOOK_IN_USE', { cause: error });
    }
    throw new AppError('BOOK_DELETE_FAILED', { cause: error });
  }
};
