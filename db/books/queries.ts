import { AppError, NotFoundError } from '@/lib/errors';
import { desc, eq } from 'drizzle-orm';
import { db } from '..';
import { books } from '../schema';
import { Book } from './types';

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
