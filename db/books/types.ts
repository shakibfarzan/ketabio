import type { Locale } from '@/constants/locales';
import { bookTranslations, books } from '../schema';

export type Book = typeof books.$inferSelect;
export type BookInsert = typeof books.$inferInsert;
export type BookTranslation = typeof bookTranslations.$inferSelect;
export type BookTranslationInsert = typeof bookTranslations.$inferInsert;

/** Per-locale values accepted by the book write path. */
export type BookTranslationInput = { title: string; description?: string | null };
export type BookTranslationsInput = Partial<Record<Locale, BookTranslationInput | undefined>>;

/** Author as it appears on a localized book (already resolved for the current locale). */
export type LocalizedBookAuthor = { id: string; slug: string; name: string };

/** Category as it appears on a localized book (already resolved for the current locale). */
export type LocalizedBookCategory = { id: string; slug: string; name: string };

/**
 * A book resolved for one locale — the shape UI components consume.
 *
 * The translation tables never leak into the UI: `title` / `description` / `author.name` /
 * `categories[].name` are already the values for the requested locale (or the fallback locale),
 * and `locale` reports which one was used.
 */
export type LocalizedBook = Book & {
  title: string;
  description: string | null;
  /** Locale the translated fields were resolved from; `null` when the book has no translation. */
  locale: Locale | null;
  author: LocalizedBookAuthor | null;
  categories: LocalizedBookCategory[];
};

export type BookListOptions = {
  /** Case-insensitive match on the translated title/description of the current locale. */
  search?: string;
  /** 1-based page number. */
  page?: number;
  pageSize?: number;
};

export type BookPage = {
  items: LocalizedBook[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
