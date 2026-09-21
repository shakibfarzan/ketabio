import { z } from 'zod';
import { FALLBACK_LOCALE, LOCALES, type Locale } from '@/constants/locales';
import { FIELD_ERROR_CODES as C } from '@/lib/errors/error-codes';

/* -------------------------------------------------------------------------- */
/*  Client-side form schema (messages come from the `Forms` next-intl namespace) */
/* -------------------------------------------------------------------------- */

/**
 * One block of inputs per locale. Only the fallback locale (`en`) is required — every other
 * language is optional, but a book always ends up with an English title so the fallback chain in
 * `db/books/queries.ts` can never come up empty.
 */
const bookFormLocaleFields = (isRequired: boolean, t: (input: string) => string) =>
  z.object({
    title: isRequired
      ? z
          .string()
          .nonempty({ message: t('isRequired') })
          .min(2, { message: t('minLength') })
      : z.string(),
    description: isRequired ? z.string().nonempty({ message: t('isRequired') }) : z.string(),
  });

export const bookFormSchema = (
  t: (input: string) => string,
  { isEdit = false }: { isEdit?: boolean } = {}
) =>
  z.object({
    translations: z.object(
      Object.fromEntries(
        LOCALES.map((locale) => [locale, bookFormLocaleFields(locale === FALLBACK_LOCALE, t)])
      ) as Record<Locale, ReturnType<typeof bookFormLocaleFields>>
    ),
    // Editing keeps the stored files unless a replacement is picked.
    coverImage: isEdit
      ? z.file().optional()
      : z.file({ message: t('isRequired') }).nonoptional({ message: t('isRequired') }),
    bookFile: isEdit
      ? z.file().optional()
      : z.file({ message: t('isRequired') }).nonoptional({ message: t('isRequired') }),
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

const bookTranslationSchema = z.object({
  title: z.string({ message: C.REQUIRED }).trim().min(2, C.TOO_SHORT).max(200, C.TOO_LONG),
  description: z.string({ message: C.INVALID }).trim().max(20000, C.TOO_LONG).optional().nullable(),
});

/**
 * `{ en: { title, description }, fa: { title, description } }` — every locale is optional, but the
 * fallback locale must carry a title (a book with no fallback translation could never be rendered).
 */
export const bookTranslationsSchema = z
  .partialRecord(z.enum(LOCALES), bookTranslationSchema)
  .superRefine((value, ctx) => {
    if (!value[FALLBACK_LOCALE]?.title) {
      ctx.addIssue({ code: 'custom', message: C.REQUIRED, path: [FALLBACK_LOCALE, 'title'] });
    }
  });

export type BookTranslationsValue = z.infer<typeof bookTranslationsSchema>;

export const createBookSchema = z.object({
  translations: bookTranslationsSchema,
  /** Optional: generated from the fallback-locale title when omitted. */
  slug: slugSchema.optional(),
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
export const bookPageSchema = z.coerce.number().int().positive().optional();
export const bookPageSizeSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(100, C.TOO_LONG)
  .optional();
export const bookSearchSchema = z.string().trim().max(200, C.TOO_LONG).optional();
