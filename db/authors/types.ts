import type { Locale } from '@/constants/locales';
import { authorTranslations, authors } from '../schema';

export type Author = typeof authors.$inferSelect;
export type AuthorInsert = typeof authors.$inferInsert;
export type AuthorTranslation = typeof authorTranslations.$inferSelect;
export type AuthorTranslationInsert = typeof authorTranslations.$inferInsert;

/** Per-locale values accepted by the author write path. */
export type AuthorTranslationInput = { name: string; bio?: string | null };
export type AuthorTranslationsInput = Partial<Record<Locale, AuthorTranslationInput | undefined>>;

/**
 * An author resolved for one locale — what UI components should receive.
 * `locale` reports which translation was used (`null` when the author has none).
 */
export type LocalizedAuthor = Author & {
  name: string;
  bio: string | null;
  locale: Locale | null;
};

/** Localized author plus its full translation list — used by the admin manager/edit dialog. */
export type AdminAuthor = LocalizedAuthor & {
  translations: AuthorTranslation[];
};

/** Fields the admin list can be ordered by. */
export type AuthorSortField = 'name' | 'createdAt';

/** Options for the paginated admin author list. */
export type AuthorListOptions = {
  /** Case-insensitive match on the translated name (requested + fallback locale). */
  search?: string;
  /** Field to order by; defaults to the localized `name`. */
  sort?: AuthorSortField;
  /** Sort direction; defaults to `asc`. */
  order?: 'asc' | 'desc';
  /** 1-based page number. */
  page?: number;
  pageSize?: number;
};

/** Paginated author list — what the admin authors manager renders. */
export type AuthorPage = {
  items: AdminAuthor[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
