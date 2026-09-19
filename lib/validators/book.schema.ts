import { z } from 'zod';
import { FIELD_ERROR_CODES as C } from '@/lib/errors/error-codes';

/* -------------------------------------------------------------------------- */
/*  Client-side form schema (messages come from the `Forms` next-intl namespace) */
/* -------------------------------------------------------------------------- */

export const bookFormSchema = (t: (input: string) => string) =>
  z.object({
    title: z
      .string()
      .nonempty({ message: t('isRequired') })
      .min(2, { message: t('minLength') }),
    description: z.string().nonempty({ message: t('isRequired') }),
    coverImage: z.file({ message: t('isRequired') }).nonoptional({ message: t('isRequired') }),
    bookFile: z.file({ message: t('isRequired') }).nonoptional({ message: t('isRequired') }),
    language: z.string().array().optional().nullable(),
    pageCount: z
      .number({ message: t('mustBeNumber') })
      .int({ message: t('mustBeInteger') })
      .positive({ message: t('mustBePositive') })
      .optional()
      .nullable(),
    publishedAt: z.coerce.date().optional().nullable(),
    authorId: z.string().nonempty({ message: t('isRequired') }),
    categoryId: z.string().nonempty({ message: t('isRequired') }),
    isbn: z.string().optional().nullable(),
  });

export type BookFormValues = z.output<ReturnType<typeof bookFormSchema>>;

/* -------------------------------------------------------------------------- */
/*  Server-side schemas. Messages are stable codes (FIELD_ERROR_CODES), never text. */
/* -------------------------------------------------------------------------- */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugSchema = z
  .string()
  .trim()
  .min(1, C.REQUIRED)
  .max(200, C.TOO_LONG)
  .regex(SLUG_PATTERN, C.INVALID_SLUG);

const bookFileSchema = z.object({
  format: z.enum(['pdf', 'epub', 'mobi', 'audio'], { message: C.INVALID }),
  fileUrl: z.url({ message: C.INVALID_URL }),
  fileSize: z
    .number({ message: C.INVALID_NUMBER })
    .int(C.MUST_BE_INTEGER)
    .nonnegative(C.INVALID_NUMBER)
    .optional()
    .nullable(),
});

export const createBookSchema = z.object({
  title: z.string({ message: C.REQUIRED }).trim().min(2, C.TOO_SHORT).max(200, C.TOO_LONG),
  /** Optional: generated from the title when omitted. */
  slug: slugSchema.optional(),
  description: z.string({ message: C.REQUIRED }).trim().min(1, C.REQUIRED),
  coverImage: z.url({ message: C.INVALID_URL }).optional().nullable(),
  language: z.string({ message: C.REQUIRED }).trim().min(1, C.REQUIRED),
  pageCount: z
    .number({ message: C.INVALID_NUMBER })
    .int(C.MUST_BE_INTEGER)
    .positive(C.MUST_BE_POSITIVE)
    .optional()
    .nullable(),
  publishedAt: z.coerce.date({ message: C.INVALID_DATE }).optional().nullable(),
  authorId: z.uuid({ message: C.INVALID_UUID }),
  categoriesIds: z.array(z.uuid({ message: C.INVALID_UUID })).min(1, C.REQUIRED),
  isbn: z.string().trim().max(32, C.TOO_LONG).optional().nullable(),
  bookFiles: z.array(bookFileSchema).min(1, C.REQUIRED),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

export const updateBookSchema = createBookSchema
  .omit({ bookFiles: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: C.REQUIRED, path: ['_form'] });

export type UpdateBookInput = z.infer<typeof updateBookSchema>;

export const bookIdSchema = z.uuid({ message: C.INVALID_UUID });
export const bookSlugSchema = slugSchema;
