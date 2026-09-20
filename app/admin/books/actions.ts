'use server';

import { getValidationErrors } from '@/lib/errors/validation';
import type { FieldErrors } from '@/lib/errors/error-codes';
import { handleActionError } from '@/lib/errors/error-handler';
import {
  bookIdSchema,
  bookPageSchema,
  bookPageSizeSchema,
  bookSearchSchema,
  bookSlugSchema,
  createBookSchema,
  updateBookSchema,
} from '@/lib/validators/book.schema';
import { fail, ok, type ActionResult } from '@/types/action-result';
import { uploadFile } from '@/utils/config-files';
import routes from '@/constants/routes';
import { LOCALES, type Locale } from '@/constants/locales';
import { revalidatePath } from 'next/cache';
import requireAdmin from '@/lib/auth/require-admin';
import { getRequestLocale } from '@/lib/request-locale';
import type { Book, BookPage, LocalizedBook } from '@/db/books/types';
import { createBook, deleteBook, updateBook } from '@/db/books/mutations';
import { getBookBySlug, paginateBooks } from '@/db/books/queries';

/**
 * Books Server Actions.
 *
 * Pattern for every action:
 *   authorize -> validate (Zod, codes only) -> repository -> ActionResult
 * Any thrown error goes through `handleActionError`, so raw database errors never leak.
 *
 * Translated fields travel as `translations.<locale>.<field>` form entries, so a new language only
 * needs a new entry in `constants/locales.ts` — no action changes.
 */

const revalidateBooks = () => revalidatePath(routes.ADMIN.BOOKS);

/* ------------------------------ helpers ------------------------------ */

const formValue = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
};

const formNumber = (formData: FormData, key: string) => {
  const value = formValue(formData, key);
  return value === undefined ? undefined : Number(value);
};

const formFile = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : undefined;
};

/** `translations.en.title`, `translations.fa.description`, … → `{ en: {…}, fa: {…} }`. */
const formTranslations = (formData: FormData) => {
  const translations: Partial<Record<Locale, { title?: string; description?: string }>> = {};

  for (const locale of LOCALES) {
    const title = formValue(formData, `translations.${locale}.title`);
    const description = formValue(formData, `translations.${locale}.description`);
    // A locale the admin left completely empty is not sent at all.
    if (title || description) translations[locale] = { title, description };
  }

  return translations;
};

/** Mirrors the client-side `bookFormSchema` field names so field errors land on the right input. */
const parseBookFormData = (formData: FormData) => ({
  translations: formTranslations(formData),
  language: formValue(formData, 'language'),
  pageCount: formNumber(formData, 'pageCount'),
  publishedAt: formValue(formData, 'publishedAt'),
  authorId: formValue(formData, 'authorId'),
  categoryId: formValue(formData, 'categoryId'),
  isbn: formValue(formData, 'isbn'),
  coverImage: formFile(formData, 'coverImage'),
  bookFile: formFile(formData, 'bookFile'),
});

/** The form uses a single `categoryId`; map the repository's array field back to it. */
const toFormFieldErrors = (fields: FieldErrors) => {
  if (fields.categoriesIds) {
    fields.categoryId = fields.categoriesIds;
    delete fields.categoriesIds;
  }
  return fields;
};

/* ------------------------------ actions ------------------------------ */

/**
 * Creates a book from the admin form: one language-independent `books` row plus one
 * `book_translations` row per filled locale, written atomically by the repository.
 * Files are uploaded only after validation succeeds.
 */
export const createBookAction = async (formData: FormData): Promise<ActionResult<Book>> => {
  try {
    await requireAdmin();

    const raw = parseBookFormData(formData);

    if (!raw.coverImage || !raw.bookFile) {
      return fail('VALIDATION_ERROR', {
        ...(raw.coverImage ? {} : { coverImage: 'REQUIRED' }),
        ...(raw.bookFile ? {} : { bookFile: 'REQUIRED' }),
      });
    }

    // Validate the metadata before spending time/money on uploads (file URLs are checked after).
    const metadata = createBookSchema.omit({ bookFiles: true, coverImage: true }).safeParse({
      translations: raw.translations,
      language: raw.language,
      pageCount: raw.pageCount,
      publishedAt: raw.publishedAt,
      authorId: raw.authorId,
      categoriesIds: raw.categoryId ? [raw.categoryId] : [],
      isbn: raw.isbn,
    });

    if (!metadata.success) {
      return fail('VALIDATION_ERROR', toFormFieldErrors(getValidationErrors(metadata.error)));
    }

    const [coverImageUrl, bookFileUrl] = await Promise.all([
      uploadFile(raw.coverImage),
      uploadFile(raw.bookFile),
    ]);

    const book = await createBook({
      ...metadata.data,
      coverImage: coverImageUrl,
      bookFiles: [{ format: 'pdf', fileUrl: bookFileUrl, fileSize: raw.bookFile.size }],
    });

    revalidateBooks();
    return ok(book);
  } catch (error) {
    return handleActionError(error, { operation: 'createBook' });
  }
};

/**
 * Updates a book: language-independent columns on `books`, translated fields upserted into
 * `book_translations`, categories replaced — all in one atomic write.
 * A cover image is only replaced when a new file is uploaded.
 */
export const updateBookAction = async (
  id: string,
  formData: FormData
): Promise<ActionResult<Book>> => {
  try {
    await requireAdmin();

    const parsedId = bookIdSchema.safeParse(id);
    if (!parsedId.success) return fail('BOOK_NOT_FOUND');

    const raw = parseBookFormData(formData);

    const metadata = updateBookSchema.omit({ coverImage: true }).safeParse({
      translations: raw.translations,
      language: raw.language,
      pageCount: raw.pageCount,
      publishedAt: raw.publishedAt,
      authorId: raw.authorId,
      categoriesIds: raw.categoryId ? [raw.categoryId] : [],
      isbn: raw.isbn,
    });

    if (!metadata.success) {
      return fail('VALIDATION_ERROR', toFormFieldErrors(getValidationErrors(metadata.error)));
    }

    const coverImage = raw.coverImage ? await uploadFile(raw.coverImage) : undefined;

    const book = await updateBook(parsedId.data, {
      ...metadata.data,
      ...(coverImage ? { coverImage } : {}),
    });

    revalidateBooks();
    revalidatePath(routes.ADMIN.EDIT_BOOK(book.slug));
    return ok(book);
  } catch (error) {
    return handleActionError(error, { operation: 'updateBook' });
  }
};

export const deleteBookAction = async (id: string): Promise<ActionResult<{ id: string }>> => {
  try {
    await requireAdmin();

    const parsedId = bookIdSchema.safeParse(id);
    if (!parsedId.success) return fail('BOOK_NOT_FOUND');

    const deleted = await deleteBook(parsedId.data);

    revalidateBooks();
    return ok({ id: deleted.id });
  } catch (error) {
    return handleActionError(error, { operation: 'deleteBook' });
  }
};

/** One book, localized for the caller's locale (public detail pages, admin edit). */
export const getBookAction = async (slug: string): Promise<ActionResult<LocalizedBook>> => {
  try {
    const parsedSlug = bookSlugSchema.safeParse(slug);
    if (!parsedSlug.success) return fail('BOOK_NOT_FOUND');

    const locale = await getRequestLocale();
    return ok(await getBookBySlug(parsedSlug.data, locale));
  } catch (error) {
    return handleActionError(error, { operation: 'getBook' });
  }
};

/** Paginated book list for the current locale; `search` matches the localized title/description. */
export const listBooksAction = async (input: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<BookPage>> => {
  try {
    const search = bookSearchSchema.safeParse(input.search);
    if (!search.success) return fail('VALIDATION_ERROR', getValidationErrors(search.error));

    const page = bookPageSchema.safeParse(input.page);
    if (!page.success) return fail('VALIDATION_ERROR', getValidationErrors(page.error));

    const pageSize = bookPageSizeSchema.safeParse(input.pageSize);
    if (!pageSize.success) return fail('VALIDATION_ERROR', getValidationErrors(pageSize.error));

    const locale = await getRequestLocale();
    return ok(
      await paginateBooks(locale, {
        search: search.data,
        page: page.data,
        pageSize: pageSize.data,
      })
    );
  } catch (error) {
    return handleActionError(error, { operation: 'listBooks' });
  }
};
