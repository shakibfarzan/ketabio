import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['member', 'admin']);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
  role: userRoleEnum('role').notNull().default('member'),
});

export const authors = pgTable('authors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
  },
  (t) => [index('categories_slug_idx').on(t.slug)]
);

export const books = pgTable(
  'books',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    coverImage: text('cover_image'),
    language: text('language'),
    pageCount: integer('page_count'),
    publishedAt: timestamp('published_at'),
    authorId: uuid('author_id').references(() => authors.id),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => [
    index('books_slug_idx').on(t.slug),
    index('books_author_idx').on(t.authorId),
    index('books_created_at_idx').on(t.createdAt),
  ]
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
