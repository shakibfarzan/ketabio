/** Constraint names from `drizzle/*.sql`. Kept here so detection stays in one place. */
export const CATEGORIES_CONSTRAINTS = {
  CATEGORIES_SLUG_UNIQUE: 'categories_slug_unique',
  /** Replaces the pre-refactor `categories_name_unique`: a name is unique per locale. */
  CATEGORY_TRANSLATIONS_NAME_UNIQUE: 'category_translations_locale_name_unique',
} as const;
