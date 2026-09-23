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

/** Fields the admin list can be ordered by. */
export type CategorySortField = 'name' | 'createdAt';

/** Options for the paginated admin category list. */
export type CategoryListOptions = {
  /** Case-insensitive match on the translated name (requested + fallback locale). */
  search?: string;
  /** Field to order by; defaults to the localized `name`. */
  sort?: CategorySortField;
  /** Sort direction; defaults to `asc`. */
  order?: 'asc' | 'desc';
  /** 1-based page number. */
  page?: number;
  pageSize?: number;
};

/** Paginated category list — what the admin categories manager renders. */
export type CategoryPage = {
  items: AdminCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
