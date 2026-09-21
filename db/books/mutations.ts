import { AppError, ConflictError, isForeignKeyViolation } from '@/lib/errors';
import { CreateBookInput, UpdateBookInput } from '@/lib/validators/book.schema';
import type { BatchItem } from 'drizzle-orm/batch';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '..';
import { bookCategories, bookFiles, bookTranslations, books } from '../schema';
import {
  mapBookWriteError,
  primaryTitle,
  toTranslationRows,
  translationUpserts,
  uniqueSlug,
} from './helpers';
import { getBookRow } from './queries';
import { Book, BookInsert } from './types';

/**
 * Book writes.
 *
 * The production driver (`drizzle-orm/neon-http`) has no `transaction()`; its atomic primitive is
 * `batch()`, which Neon executes as a single transaction. Every multi-statement write below goes
 * through one `batch`, so a failure can never leave a book without its translations, categories or
 * files. Book ids are generated with `randomUUID()` (instead of by the database) precisely so the
 * dependent rows can be part of the same batch.
 */

export const createBook = async (input: CreateBookInput): Promise<Book> => {
  const { bookFiles: files, categoriesIds, slug: requestedSlug, translations, ...data } = input;

  try {
    // An explicit slug must be respected (conflict -> BOOK_SLUG_EXISTS);
    // a generated one is made unique up-front.
    const slug = requestedSlug ?? (await uniqueSlug(primaryTitle(translations)));
    const id = randomUUID();

    const [created] = await db.batch([
      db
        .insert(books)
        .values({ ...data, id, slug } satisfies BookInsert)
        .returning(),
      db.insert(bookTranslations).values(toTranslationRows(id, translations)),
      db
        .insert(bookCategories)
        .values(categoriesIds.map((categoryId) => ({ bookId: id, categoryId }))),
      db.insert(bookFiles).values(files.map((file) => ({ ...file, bookId: id }))),
    ]);

    return created[0];
  } catch (error) {
    throw mapBookWriteError(error) ?? new AppError('BOOK_CREATE_FAILED', { cause: error });
  }
};

export const updateBook = async (id: string, input: UpdateBookInput): Promise<Book> => {
  await getBookRow(id); // -> BOOK_NOT_FOUND

  const { categoriesIds, translations, ...data } = input;

  try {
    // Always reads the book back as the first statement, so the caller gets the stored row whether
    // or not any language-independent column changed.
    const statements: [BatchItem<'pg'>, ...BatchItem<'pg'>[]] = [
      Object.keys(data).length > 0
        ? db.update(books).set(data).where(eq(books.id, id)).returning()
        : db.select().from(books).where(eq(books.id, id)),
    ];

    if (translations) statements.push(...translationUpserts(id, translations));

    if (categoriesIds) {
      statements.push(
        db.delete(bookCategories).where(eq(bookCategories.bookId, id)),
        db
          .insert(bookCategories)
          .values(categoriesIds.map((categoryId) => ({ bookId: id, categoryId })))
      );
    }

    const [bookRows] = await db.batch(statements);
    return (bookRows as Book[])[0];
  } catch (error) {
    throw mapBookWriteError(error) ?? new AppError('BOOK_UPDATE_FAILED', { cause: error });
  }
};

export const deleteBook = async (id: string): Promise<Book> => {
  await getBookRow(id); // -> BOOK_NOT_FOUND

  try {
    // book_categories has no ON DELETE CASCADE; book_files and book_translations do.
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
