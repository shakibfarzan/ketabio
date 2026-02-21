import { z } from 'zod';

export const bookFormSchema = (t: (input: string) => string) =>
  z.object({
    title: z
      .string()
      .min(2, { message: t('minLength') })
      .nonoptional({ message: t('isRequired') }),
    description: z.string().nonoptional({ message: t('isRequired') }),
    coverImage: z.file({ message: t('invalidFile') }).nonoptional({ message: t('isRequired') }),
    bookFile: z.file({ message: t('invalidFile') }).nonoptional({ message: t('isRequired') }),
    language: z.string().optional().nullable(),
    pageCount: z
      .number({ message: t('mustBeNumber') })
      .int({ message: t('mustBeInteger') })
      .positive({ message: t('mustBePositive') })
      .optional()
      .nullable(),
    publishedAt: z.coerce
      .date({ message: t('invalidDate') })
      .optional()
      .nullable(),
    author: z.uuid({ message: t('invalidUuid') }).nonoptional({ message: t('isRequired') }),
    category: z.uuid({ message: t('invalidUuid') }).nonoptional({ message: t('isRequired') }),
    isbn: z.string().optional().nullable(),
  });
