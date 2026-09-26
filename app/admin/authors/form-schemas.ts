import { FALLBACK_LOCALE, LOCALES, type Locale } from '@/constants/locales';
import { TFunctionType } from '@/types/t-function-type';
import z from 'zod';

/**
 * Author name and biography, once per supported locale.
 *
 * Only the fallback locale's name is required: an author always has an English name so the locale
 * fallback in `db/authors/queries.ts` can resolve it. Every other field (other locales, all bios)
 * is optional. The avatar is language-independent and always optional.
 */
export const authorSchema = (tForms: TFunctionType) =>
  z.object({
    translations: z.object(
      Object.fromEntries(
        LOCALES.map((locale) => [
          locale,
          z.object({
            name:
              locale === FALLBACK_LOCALE
                ? z.string().trim().min(2, tForms('minLength')).max(100, tForms('maxLength100'))
                : z.string().trim().max(100, tForms('maxLength100')),
            bio: z.string().trim().max(2000, tForms('maxLength2000')).optional(),
          }),
        ])
      ) as Record<Locale, z.ZodObject<{ name: z.ZodString; bio: z.ZodOptional<z.ZodString> }>>
    ),
    // The file uploader emits an array; only the first file is used as the avatar.
    avatar: z.array(z.file()).optional(),
  });

export type AuthorFormValues = z.output<ReturnType<typeof authorSchema>>;

export const emptyAuthorTranslations = () =>
  Object.fromEntries(
    LOCALES.map((locale) => [locale, { name: '', bio: '' }])
  ) as AuthorFormValues['translations'];

export const emptyAuthorValues = (): AuthorFormValues => ({
  translations: emptyAuthorTranslations(),
  avatar: [],
});
