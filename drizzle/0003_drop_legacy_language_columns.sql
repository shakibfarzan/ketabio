-- ============================================================================
-- Multilingual dynamic content — phase 2 of 2 (DESTRUCTIVE)
--
-- Removes the legacy language-specific columns now that their content lives in
-- the `*_translations` tables (see `0002_add_translation_tables.sql`).
--
-- Each guard below aborts the whole migration if a record would lose its only
-- translatable value, so this file can never silently blank out the catalog.
-- Run phase 1, verify the translations, then run this one.
-- ============================================================================

DO $$
DECLARE
  orphan_books integer;
  orphan_authors integer;
  orphan_categories integer;
BEGIN
  SELECT count(*) INTO orphan_books FROM "books" b
    WHERE NOT EXISTS (SELECT 1 FROM "book_translations" t WHERE t."book_id" = b."id");
  SELECT count(*) INTO orphan_authors FROM "authors" a
    WHERE NOT EXISTS (SELECT 1 FROM "author_translations" t WHERE t."author_id" = a."id");
  SELECT count(*) INTO orphan_categories FROM "categories" c
    WHERE NOT EXISTS (SELECT 1 FROM "category_translations" t WHERE t."category_id" = c."id");

  IF orphan_books > 0 OR orphan_authors > 0 OR orphan_categories > 0 THEN
    RAISE EXCEPTION
      'Refusing to drop legacy columns: % book(s), % author(s) and % category(ies) have no translation row',
      orphan_books, orphan_authors, orphan_categories;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_unique";--> statement-breakpoint
ALTER TABLE "authors" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "authors" DROP COLUMN "bio";--> statement-breakpoint
ALTER TABLE "books" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "books" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "name";
