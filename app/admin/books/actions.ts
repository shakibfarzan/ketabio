'use server';

import * as booksRepository from '@/db/books';
import type { Book } from '@/db/books';
import { getValidationErrors } from '@/lib/errors/validation';
import { handleActionError } from '@/lib/errors/error-handler';
import {
  bookIdSchema,
  bookSlugSchema,
  createBookSchema,
  updateBookSchema,
} from '@/lib/validators/book.schema';
import { fail, ok, type ActionResult } from '@/types/action-result';
import { uploadFile } from '@/utils/config-files';
import routes from '@/constants/routes';
import { revalidatePath } from 'next/cache';
import requireAdmin from '@/lib/auth/require-admin';

/**
 * Books Server Actions.
 *
 * Pattern for every action:
 *   authorize -> validate (Zod, codes only) -> repository -> ActionResult
 * Any thrown error goes through `handleActionError`, so raw database errors never leak.
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

/** Mirrors the client-side `bookFormSchema` field names so field errors land on the right input. */
const parseBookFormData = (formData: FormData) => ({
  title: formValue(formData, 'title'),
  description: formValue(formData, 'description'),
  language: formValue(formData, 'language'),
  pageCount: formNumber(formData, 'pageCount'),
  publishedAt: formValue(formData, 'publishedAt'),
  authorId: formValue(formData, 'authorId'),
  categoryId: formValue(formData, 'categoryId'),
  isbn: formValue(formData, 'isbn'),
  coverImage: formFile(formData, 'coverImage'),
  bookFile: formFile(formData, 'bookFile'),
});

/* ------------------------------ actions ------------------------------ */

/**
 * Creates a book from the admin form. Files are uploaded only after validation succeeds.
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
      title: raw.title,
      description: raw.description,
      language: raw.language,
      pageCount: raw.pageCount,
      publishedAt: raw.publishedAt,
      authorId: raw.authorId,
      categoriesIds: raw.categoryId ? [raw.categoryId] : [],
      isbn: raw.isbn,
    });

    if (!metadata.success) {
      const fields = getValidationErrors(metadata.error);
      // Form uses a single `categoryId`; map the array field back to it.
      if (fields.categoriesIds) {
        fields.categoryId = fields.categoriesIds;
        delete fields.categoriesIds;
      }
      return fail('VALIDATION_ERROR', fields);
    }

    const [coverImageUrl, bookFileUrl] = await Promise.all([
      uploadFile(raw.coverImage),
      uploadFile(raw.bookFile),
    ]);

    const book = await booksRepository.createBook({
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

export const updateBookAction = async (id: string, input: unknown): Promise<ActionResult<Book>> => {
  try {
    await requireAdmin();

    const parsedId = bookIdSchema.safeParse(id);
    if (!parsedId.success) return fail('BOOK_NOT_FOUND');

    const validated = updateBookSchema.safeParse(input);
    if (!validated.success) {
      return fail('VALIDATION_ERROR', getValidationErrors(validated.error));
    }

    const book = await booksRepository.updateBook(parsedId.data, validated.data);

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

    const deleted = await booksRepository.deleteBook(parsedId.data);

    revalidateBooks();
    return ok({ id: deleted.id });
  } catch (error) {
    return handleActionError(error, { operation: 'deleteBook' });
  }
};

export const getBookAction = async (slug: string): Promise<ActionResult<Book>> => {
  try {
    const parsedSlug = bookSlugSchema.safeParse(slug);
    if (!parsedSlug.success) return fail('BOOK_NOT_FOUND');

    return ok(await booksRepository.getBookBySlug(parsedSlug.data));
  } catch (error) {
    return handleActionError(error, { operation: 'getBook' });
  }
};

export const listBooksAction = async (): Promise<ActionResult<Book[]>> => {
  try {
    return ok(await booksRepository.listBooks());
  } catch (error) {
    return handleActionError(error, { operation: 'listBooks' });
  }
};
