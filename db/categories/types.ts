import type { Locale } from '@/constants/locales';
import { categories, categoryTranslations } from '../schema';

export type Category = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;
export type CategoryTranslation = typeof categoryTranslations.$inferSelect;
export type CategoryTranslationInsert = typeof categoryTranslations.$inferInsert;

/** Per-locale values accepted by the category write path. */
export type CategoryTranslationInput = { name: string };
export type CategoryTranslationsInput = Partial<
  Record<Locale, CategoryTranslationInput | undefined>
>;

/**
 * A category resolved for one locale — what UI components should receive.
 * `locale` reports which translation was used (`null` when the category has none).
 */
export type LocalizedCategory = Category & {
  name: string;
  locale: Locale | null;
};

/** Localized category plus its full translation list — used by the admin manager/edit dialog. */
export type AdminCategory = LocalizedCategory & {
  translations: CategoryTranslation[];
};
