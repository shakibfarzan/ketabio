import { FALLBACK_LOCALE, LOCALES, type Locale } from '@/constants/locales';
import { TFunctionType } from '@/types/t-function-type';
import z from 'zod';

/**
 * Category name, once per supported locale.
 *
 * Only the fallback locale is required: a category always has an English name so the locale
 * fallback in `db/categories/queries.ts` can resolve it. Other locales are optional.
 */
export const categorySchema = (tForms: TFunctionType) =>
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
          }),
        ])
      ) as Record<Locale, z.ZodObject<{ name: z.ZodString }>>
    ),
  });

export type CategoryFormValues = z.output<ReturnType<typeof categorySchema>>;

export const emptyCategoryTranslations = () =>
  Object.fromEntries(
    LOCALES.map((locale) => [locale, { name: '' }])
  ) as CategoryFormValues['translations'];
