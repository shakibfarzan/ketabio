import { FALLBACK_LOCALE, localeChain, type Locale } from '@/constants/locales';
import { AppError, NotFoundError } from '@/lib/errors';
import { and, asc, count, desc, eq, exists, ilike, inArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '..';
import {
  authorTranslations,
  authors,
  bookCategories,
  bookTranslations,
  books,
  categories,
  categoryTranslations,
} from '../schema';
import { escapeLikePattern, localizedColumn, resolvedLocaleColumn } from '../translation-sql';
import type {
  Book,
  BookListOptions,
  BookPage,
  BookTranslation,
  LocalizedBook,
  LocalizedBookCategory,
} from './types';

/**
 * Localized book reads.
 *
 * Every query joins `book_translations` twice (requested locale + fallback locale) and the author's
 * translations twice, then flattens each pair with `COALESCE`, so the result is one row per book
 * with plain `title` / `description` / `author.name` fields. Categories come from a second query
 * grouped in memory — joining them inline would multiply rows and break pagination.
 */

const bookTranslation = alias(bookTranslations, 'book_translation');
const bookTranslationFallback = alias(bookTranslations, 'book_translation_fallback');
const authorTranslation = alias(authorTranslations, 'author_translation');
const authorTranslationFallback = alias(authorTranslations, 'author_translation_fallback');
const categoryTranslation = alias(categoryTranslations, 'category_translation');
const categoryTranslationFallback = alias(categoryTranslations, 'category_translation_fallback');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type BookQueryOptions = BookListOptions & { id?: string; slug?: string };

const normalizePaging = (options: BookListOptions) => {
  const pageSize = Math.min(
    Math.max(Math.trunc(options.pageSize ?? DEFAULT_PAGE_SIZE), 1),
    MAX_PAGE_SIZE
  );
  const page = Math.max(Math.trunc(options.page ?? 1), 1);
  return { page, pageSize };
};

/**
 * Case-insensitive match against the translated title/description of the requested locale and of
 * the fallback locale, so a search always covers what the user can read.
 */
const matchesSearch = (term: string, locale: Locale) =>
  exists(
    db
      .select({ found: sql`1` })
      .from(bookTranslations)
      .where(
        and(
          eq(bookTranslations.bookId, books.id),
          inArray(bookTranslations.locale, localeChain(locale)),
          or(
            ilike(bookTranslations.title, escapeLikePattern(term)),
            ilike(bookTranslations.description, escapeLikePattern(term))
          )
        )
      )
  );

const selectBooks = (locale: Locale, options: BookQueryOptions = {}) => {
  const { page, pageSize } = normalizePaging(options);
  const term = options.search?.trim();

  return db
    .select({
      id: books.id,
      slug: books.slug,
      coverImage: books.coverImage,
      language: books.language,
      pageCount: books.pageCount,
      publishedAt: books.publishedAt,
      authorId: books.authorId,
      createdAt: books.createdAt,
      isbn: books.isbn,
      title: localizedColumn<string | null>(bookTranslation.title, bookTranslationFallback.title),
      description: localizedColumn<string | null>(
        bookTranslation.description,
        bookTranslationFallback.description
      ),
      locale: resolvedLocaleColumn(bookTranslation.id, bookTranslationFallback.id, locale),
      authorRowId: authors.id,
      authorSlug: authors.slug,
      authorName: localizedColumn<string | null>(
        authorTranslation.name,
        authorTranslationFallback.name
      ),
    })
    .from(books)
    .leftJoin(
      bookTranslation,
      and(eq(bookTranslation.bookId, books.id), eq(bookTranslation.locale, locale))
    )
    .leftJoin(
      bookTranslationFallback,
      and(
        eq(bookTranslationFallback.bookId, books.id),
        eq(bookTranslationFallback.locale, FALLBACK_LOCALE)
      )
    )
    .leftJoin(authors, eq(books.authorId, authors.id))
    .leftJoin(
      authorTranslation,
      and(eq(authorTranslation.authorId, authors.id), eq(authorTranslation.locale, locale))
    )
    .leftJoin(
      authorTranslationFallback,
      and(
        eq(authorTranslationFallback.authorId, authors.id),
        eq(authorTranslationFallback.locale, FALLBACK_LOCALE)
      )
    )
    .where(
      and(
        options.id ? eq(books.id, options.id) : undefined,
        options.slug ? eq(books.slug, options.slug) : undefined,
        term ? matchesSearch(term, locale) : undefined
      )
    )
    .orderBy(desc(books.createdAt), asc(books.slug))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
};

type BookRow = Awaited<ReturnType<typeof selectBooks>>[number];

const toLocalizedBook = (row: BookRow, categoriesList: LocalizedBookCategory[]): LocalizedBook => ({
  id: row.id,
  slug: row.slug,
  coverImage: row.coverImage,
  language: row.language,
  pageCount: row.pageCount,
  publishedAt: row.publishedAt,
  authorId: row.authorId,
  createdAt: row.createdAt,
  isbn: row.isbn,
  // A book always has a translation in FALLBACK_LOCALE (enforced on create/update); the `?? ''`
  // only keeps the UI safe for rows written outside the application.
  title: row.title ?? '',
  description: row.description,
  locale: row.locale,
  author:
    row.authorRowId && row.authorSlug
      ? { id: row.authorRowId, slug: row.authorSlug, name: row.authorName ?? '' }
      : null,
  categories: categoriesList,
});

/** Second stage of every read: resolve and group the categories of the books in `rows`. */
const attachCategories = async (rows: BookRow[], locale: Locale): Promise<LocalizedBook[]> => {
  const grouped = new Map<string, LocalizedBookCategory[]>();
  const bookIds = rows.map((row) => row.id);

  if (bookIds.length > 0) {
    const links = await db
      .select({
        bookId: bookCategories.bookId,
        id: categories.id,
        slug: categories.slug,
        name: localizedColumn<string | null>(
          categoryTranslation.name,
          categoryTranslationFallback.name
        ),
      })
      .from(bookCategories)
      .innerJoin(categories, eq(bookCategories.categoryId, categories.id))
      .leftJoin(
        categoryTranslation,
        and(
          eq(categoryTranslation.categoryId, categories.id),
          eq(categoryTranslation.locale, locale)
        )
      )
      .leftJoin(
        categoryTranslationFallback,
        and(
          eq(categoryTranslationFallback.categoryId, categories.id),
          eq(categoryTranslationFallback.locale, FALLBACK_LOCALE)
        )
      )
      .where(inArray(bookCategories.bookId, bookIds))
      .orderBy(asc(categories.slug));

    for (const link of links) {
      if (!link.bookId) continue;
      const list = grouped.get(link.bookId) ?? [];
      list.push({ id: link.id, slug: link.slug, name: link.name ?? '' });
      grouped.set(link.bookId, list);
    }
  }

  return rows.map((row) => toLocalizedBook(row, grouped.get(row.id) ?? []));
};

const countBooks = async (locale: Locale, search?: string): Promise<number> => {
  const term = search?.trim();
  const [row] = await db
    .select({ value: count() })
    .from(books)
    .where(term ? matchesSearch(term, locale) : undefined);
  return row?.value ?? 0;
};

/** Books for the given locale, newest first. */
export const listBooks = async (
  locale: Locale,
  options: BookListOptions = {}
): Promise<LocalizedBook[]> => {
  try {
    return await attachCategories(await selectBooks(locale, options), locale);
  } catch (error) {
    throw new AppError('BOOK_FETCH_FAILED', { cause: error });
  }
};

/** Paginated, searchable book list — used by the admin table and public listings. */
export const paginateBooks = async (
  locale: Locale,
  options: BookListOptions = {}
): Promise<BookPage> => {
  const { page, pageSize } = normalizePaging(options);
  try {
    const [rows, total] = await Promise.all([
      selectBooks(locale, { ...options, page, pageSize }),
      countBooks(locale, options.search),
    ]);
    return {
      items: await attachCategories(rows, locale),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    };
  } catch (error) {
    throw new AppError('BOOK_FETCH_FAILED', { cause: error });
  }
};

/**
 * Searches the translated title/description of the current locale (plus the fallback locale).
 * Thin wrapper over `paginateBooks` so search, sorting and pagination stay one code path.
 */
export const searchBooks = async (
  term: string,
  locale: Locale,
  options: Omit<BookListOptions, 'search'> = {}
): Promise<BookPage> => paginateBooks(locale, { ...options, search: term });

export const getBookById = async (id: string, locale: Locale): Promise<LocalizedBook> => {
  let books_: LocalizedBook[];
  try {
    books_ = await attachCategories(await selectBooks(locale, { id, pageSize: 1 }), locale);
  } catch (error) {
    throw new AppError('BOOK_FETCH_FAILED', { cause: error });
  }
  const book = books_[0];
  if (!book) throw new NotFoundError('BOOK_NOT_FOUND');
  return book;
};

export const getBookBySlug = async (slug: string, locale: Locale): Promise<LocalizedBook> => {
  let found: LocalizedBook[];
  try {
    found = await attachCategories(await selectBooks(locale, { slug, pageSize: 1 }), locale);
  } catch (error) {
    throw new AppError('BOOK_FETCH_FAILED', { cause: error });
  }
  const book = found[0];
  if (!book) throw new NotFoundError('BOOK_NOT_FOUND');
  return book;
};

/**
 * Raw, unlocalized helpers for the write path and the edit form: the language-independent row and
 * the full translation list (every locale, unresolved).
 */
export const getBookRow = async (id: string): Promise<Book> => {
  let book: Book | undefined;
  try {
    book = await db.query.books.findFirst({ where: eq(books.id, id) });
  } catch (error) {
    throw new AppError('BOOK_FETCH_FAILED', { cause: error });
  }
  if (!book) throw new NotFoundError('BOOK_NOT_FOUND');
  return book;
};

export const getBookTranslations = async (bookId: string): Promise<BookTranslation[]> => {
  try {
    return await db
      .select()
      .from(bookTranslations)
      .where(eq(bookTranslations.bookId, bookId))
      .orderBy(asc(bookTranslations.locale));
  } catch (error) {
    throw new AppError('BOOK_FETCH_FAILED', { cause: error });
  }
};
