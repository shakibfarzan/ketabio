/** Constraint names from `drizzle/*.sql`. Kept here so detection stays in one place. */
export const BOOKS_CONSTRAINTS = {
  BOOKS_SLUG_UNIQUE: 'books_slug_unique',
  BOOKS_AUTHOR_FK: 'books_author_id_authors_id_fk',
  BOOK_CATEGORIES_CATEGORY_FK: 'book_categories_category_id_categories_id_fk',
} as const;
