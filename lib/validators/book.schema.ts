import { z } from 'zod';

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
    author: z.string().nonempty({ message: t('isRequired') }),
    category: z.string().nonempty({ message: t('isRequired') }),
    isbn: z.string().optional().nullable(),
  });
