import { z } from 'zod';

const bookSchema = (t: (input: string) => string) =>
  z.object({
    title: z
      .string()
      .min(2, { message: t('minLength') })
      .nonoptional({ message: t('isRequired') }),
    description: z.string().optional().nullable(),
    coverImage: z
      .url({ message: t('invalidUrl') })
      .optional()
      .nullable(),
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
    authorId: z
      .uuid({ message: t('invalidUuid') })
      .optional()
      .nullable(),
  });

export default bookSchema;
