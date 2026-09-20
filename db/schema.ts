import { LOCALES } from '@/constants/locales';
import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export const userRoleEnum = pgEnum('user_role', ['member', 'admin']);
export const bookFormatEnum = pgEnum('book_format', ['pdf', 'epub', 'mobi', 'audio']);

/**
 * Locales a translation row can be written for. Generated from `LOCALES` so the database and the
 * application can never drift apart (`constants/locales.ts`).
 */
export const localeEnum = pgEnum('locale', LOCALES);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  role: userRoleEnum('role').notNull().default('member'),
});

/* -------------------------------------------------------------------------- */
/*  Authors                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Language-independent author data. The author's name and biography live in
 * `author_translations` (one row per locale).
 */
export const authors = pgTable(
  'authors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Canonical, language-independent identifier used in URLs. */
    slug: text('slug').notNull().unique(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [index('authors_slug_idx').on(t.slug)]
);

export const authorTranslations = pgTable(
  'author_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => authors.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    name: text('name').notNull(),
    bio: text('bio'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    unique('author_translations_author_id_locale_unique').on(t.authorId, t.locale),
    index('author_translations_author_idx').on(t.authorId),
    index('author_translations_locale_idx').on(t.locale),
  ]
);

/* -------------------------------------------------------------------------- */
/*  Categories                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Language-independent taxonomy node. The display name lives in `category_translations`.
 *
 * Note: categories are flat today (there is no hierarchy yet). If one is added later, the
 * `parent_id` column belongs here on `categories` — never on the translation table — so the
 * tree stays identical in every language.
 */
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [index('categories_slug_idx').on(t.slug)]
);

export const categoryTranslations = pgTable(
  'category_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    unique('category_translations_category_id_locale_unique').on(t.categoryId, t.locale),
    // Preserves the pre-refactor rule that a category name is unique (`categories_name_unique`).
    unique('category_translations_locale_name_unique').on(t.locale, t.name),
    index('category_translations_category_idx').on(t.categoryId),
    index('category_translations_locale_idx').on(t.locale),
  ]
);

/* -------------------------------------------------------------------------- */
/*  Books                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Language-independent book record. Title and description live in `book_translations`
 * (one row per locale); `slug` stays here so every locale links to the same canonical entity.
 */
export const books = pgTable(
  'books',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    coverImage: text('cover_image'),
    /** Language the work was originally written in — metadata, not a translation. */
    language: text('language').notNull(),
    pageCount: integer('page_count'),
    publishedAt: timestamp('published_at'),
    authorId: uuid('author_id').references(() => authors.id),
    createdAt: timestamp('created_at').defaultNow(),
    isbn: text('isbn'),
  },
  (t) => [
    index('books_slug_idx').on(t.slug),
    index('books_author_idx').on(t.authorId),
    index('books_created_at_idx').on(t.createdAt),
  ]
);

export const bookTranslations = pgTable(
  'book_translations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    unique('book_translations_book_id_locale_unique').on(t.bookId, t.locale),
    index('book_translations_book_idx').on(t.bookId),
    index('book_translations_locale_idx').on(t.locale),
  ]
);

export const bookFiles = pgTable(
  'book_files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    format: bookFormatEnum('format').notNull(),
    fileUrl: text('file_url').notNull(),
    fileSize: integer('file_size'), // bytes
    version: integer('version').default(1),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [index('book_files_book_idx').on(t.bookId), index('book_files_format_idx').on(t.format)]
);

export const bookCategories = pgTable(
  'book_categories',
  {
    bookId: uuid('book_id').references(() => books.id),
    categoryId: uuid('category_id').references(() => categories.id),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.categoryId] })]
);

export const shelves = pgTable('shelves', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const shelfBooks = pgTable(
  'shelf_books',
  {
    shelfId: uuid('shelf_id').references(() => shelves.id),
    bookId: uuid('book_id').references(() => books.id),
    addedAt: timestamp('added_at').defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.shelfId, t.bookId] })]
);

export const readingProgress = pgTable('reading_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id),
  bookId: uuid('book_id').references(() => books.id),
  currentPage: integer('current_page'),
  percentage: integer('percentage'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id),
  bookId: uuid('book_id').references(() => books.id),
  rating: integer('rating').notNull(),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const favorites = pgTable(
  'favorites',
  {
    userId: text('user_id').references(() => users.id),
    bookId: uuid('book_id').references(() => books.id),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.bookId] })]
);

/* -------------------------------------------------------------------------- */
/*  Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const authorsRelations = relations(authors, ({ many }) => ({
  translations: many(authorTranslations),
  books: many(books),
}));

export const authorTranslationsRelations = relations(authorTranslations, ({ one }) => ({
  author: one(authors, {
    fields: [authorTranslations.authorId],
    references: [authors.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  translations: many(categoryTranslations),
  bookCategories: many(bookCategories),
}));

export const categoryTranslationsRelations = relations(categoryTranslations, ({ one }) => ({
  category: one(categories, {
    fields: [categoryTranslations.categoryId],
    references: [categories.id],
  }),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  translations: many(bookTranslations),
  author: one(authors, { fields: [books.authorId], references: [authors.id] }),
  files: many(bookFiles),
  bookCategories: many(bookCategories),
}));

export const bookTranslationsRelations = relations(bookTranslations, ({ one }) => ({
  book: one(books, { fields: [bookTranslations.bookId], references: [books.id] }),
}));

export const bookFilesRelations = relations(bookFiles, ({ one }) => ({
  book: one(books, { fields: [bookFiles.bookId], references: [books.id] }),
}));

export const bookCategoriesRelations = relations(bookCategories, ({ one }) => ({
  book: one(books, { fields: [bookCategories.bookId], references: [books.id] }),
  category: one(categories, {
    fields: [bookCategories.categoryId],
    references: [categories.id],
  }),
}));
