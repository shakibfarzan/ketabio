/** Constraint names from `drizzle/*.sql`. Kept here so detection stays in one place. */
export const CATEGORIES_CONSTRAINTS = {
  CATEGORIES_NAME_UNIQUE: 'categories_name_unique',
  CATEGORIES_SLUG_UNIQUE: 'categories_slug_unique',
} as const;
