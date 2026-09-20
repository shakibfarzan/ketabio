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
  locale: Locale | null;
};
