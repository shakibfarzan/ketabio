import { db } from '@/db';
import { bookCategories, bookFiles, books } from '@/db/schema';
import { AppError, ConflictError, NotFoundError } from '@/lib/errors/app-error';
import { isForeignKeyViolation, isUniqueViolation } from '@/lib/errors/database-error';
import type { CreateBookInput, UpdateBookInput } from '@/lib/validators/book.schema';
import slugify from '@/utils/slugify';
import { desc, eq } from 'drizzle-orm';

/**
 * Books repository.
 *
 * Talks to Drizzle, normalizes PostgreSQL errors into `AppError`s and knows nothing about
 * locales or translations. Callers (Server Actions) turn thrown errors into `ActionResult`s.
 */

export type Book = typeof books.$inferSelect;
type BookInsert = typeof books.$inferInsert;

/** Constraint names from `drizzle/*.sql`. Kept here so detection stays in one place. */
const CONSTRAINTS = {
  BOOKS_SLUG_UNIQUE: 'books_slug_unique',
  BOOKS_AUTHOR_FK: 'books_author_id_authors_id_fk',
  BOOK_CATEGORIES_CATEGORY_FK: 'book_categories_category_id_categories_id_fk',
} as const;

/* ------------------------------ helpers ------------------------------ */

const toSlug = (title: string) => slugify(title) || 'book';

/** Finds a free slug by appending `-2`, `-3`, ... when needed. */
const uniqueSlug = async (base: string, excludedId?: string) => {
  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await db.query.books.findFirst({
      columns: { id: true },
      where: eq(books.slug, slug),
    });

    if (!existing || existing.id === excludedId) return slug;
    slug = `${base}-${counter++}`;
  }
};

/**
 * Maps write-time constraint violations shared by create/update to application errors.
 * Returns `null` when the error is not a recognised constraint violation.
 */
const mapBookWriteError = (error: unknown): AppError | null => {
  if (isUniqueViolation(error, CONSTRAINTS.BOOKS_SLUG_UNIQUE)) {
    return new ConflictError('BOOK_SLUG_EXISTS', {
      cause: error,
      fields: { slug: 'BOOK_SLUG_EXISTS' },
    });
  }
  if (isForeignKeyViolation(error, CONSTRAINTS.BOOKS_AUTHOR_FK)) {
    return new AppError('VALIDATION_ERROR', { cause: error, fields: { authorId: 'INVALID' } });
  }
  if (isForeignKeyViolation(error, CONSTRAINTS.BOOK_CATEGORIES_CATEGORY_FK)) {
    return new AppError('VALIDATION_ERROR', {
      cause: error,
      fields: { categoriesIds: 'INVALID' },
    });
  }
  return null;
};

/* ------------------------------- reads ------------------------------- */

export const listBooks = async (): Promise<Book[]> => {
  try {
    return await db.select().from(books).orderBy(desc(books.createdAt));
  } catch (error) {
    throw new AppError('BOOK_FETCH_FAILED', { cause: error });
  }
};

export const getBookById = async (id: string): Promise<Book> => {
  let book: Book | undefined;
  try {
    book = await db.query.books.findFirst({ where: eq(books.id, id) });
  } catch (error) {
    throw new AppError('BOOK_FETCH_FAILED', { cause: error });
  }
  if (!book) throw new NotFoundError('BOOK_NOT_FOUND');
  return book;
};

export const getBookBySlug = async (slug: string): Promise<Book> => {
  let book: Book | undefined;
  try {
    book = await db.query.books.findFirst({ where: eq(books.slug, slug) });
  } catch (error) {
    throw new AppError('BOOK_FETCH_FAILED', { cause: error });
  }
  if (!book) throw new NotFoundError('BOOK_NOT_FOUND');
  return book;
};

/* ------------------------------ writes ------------------------------- */

export const createBook = async (input: CreateBookInput): Promise<Book> => {
  const { bookFiles: files, categoriesIds, slug: requestedSlug, ...data } = input;

  try {
    // An explicit slug must be respected (conflict -> BOOK_SLUG_EXISTS);
    // a generated one is made unique up-front.
    const slug = requestedSlug ?? (await uniqueSlug(toSlug(data.title)));

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
