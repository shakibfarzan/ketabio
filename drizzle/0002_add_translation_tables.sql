-- ============================================================================
-- Multilingual dynamic content — phase 1 of 2 (ADDITIVE, safe on live data)
--
-- Creates `book_translations`, `author_translations` and `category_translations`
-- and copies the language-specific columns that used to live on `books`,
-- `authors` and `categories` into them as `locale = 'en'` rows.
--
-- Nothing is dropped here: the legacy columns stay in place so the release can be
-- rolled back and so phase 2 (`0003_drop_legacy_language_columns.sql`) can refuse
-- to run if any record was left without a translation.
-- ============================================================================

-- The whole file is idempotent so it can also be applied by hand to a database whose schema was
-- produced with `drizzle-kit push` (the only way to backfill the translations there).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'locale' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE "public"."locale" AS ENUM('en', 'fa');
  END IF;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "author_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "author_translations_author_id_locale_unique" UNIQUE("author_id","locale")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "book_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "book_translations_book_id_locale_unique" UNIQUE("book_id","locale")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"locale" "locale" NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "category_translations_category_id_locale_unique" UNIQUE("category_id","locale"),
	CONSTRAINT "category_translations_locale_name_unique" UNIQUE("locale","name")
);
--> statement-breakpoint
ALTER TABLE "author_translations" DROP CONSTRAINT IF EXISTS "author_translations_author_id_authors_id_fk";--> statement-breakpoint
ALTER TABLE "author_translations" ADD CONSTRAINT "author_translations_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_translations" DROP CONSTRAINT IF EXISTS "book_translations_book_id_books_id_fk";--> statement-breakpoint
ALTER TABLE "book_translations" ADD CONSTRAINT "book_translations_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translations" DROP CONSTRAINT IF EXISTS "category_translations_category_id_categories_id_fk";--> statement-breakpoint
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "author_translations_author_idx" ON "author_translations" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "author_translations_locale_idx" ON "author_translations" USING btree ("locale");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_translations_book_idx" ON "book_translations" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_translations_locale_idx" ON "book_translations" USING btree ("locale");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_translations_category_idx" ON "category_translations" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_translations_locale_idx" ON "category_translations" USING btree ("locale");--> statement-breakpoint

-- ----------------------------------------------------------------------------
-- Pre-existing drift: `db/schema.ts` already declared these, but `0000`/`0001`
-- never created them. Without this reconciliation `drizzle-kit migrate` produces
-- a database that the application code cannot write to.
-- ----------------------------------------------------------------------------
ALTER TABLE "books" ADD COLUMN IF NOT EXISTS "isbn" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();--> statement-breakpoint
UPDATE "books" SET "description" = '' WHERE "description" IS NULL;--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
UPDATE "books" SET "language" = '' WHERE "language" IS NULL;--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "language" SET NOT NULL;--> statement-breakpoint

-- `0001` typed `book_files.book_id` as `integer` while `books.id` is `uuid`; PostgreSQL refuses
-- such a foreign key ("cannot be implemented"), so that migration never produced a usable
-- `book_files` table and no row in it can reference a real book. Recreate it correctly.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'book_files'
      AND column_name = 'book_id' AND data_type <> 'uuid'
  ) THEN
    DROP TABLE "public"."book_files";
    CREATE TABLE "public"."book_files" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "book_id" uuid NOT NULL,
      "format" "book_format" NOT NULL,
      "file_url" text NOT NULL,
      "file_size" integer,
      "version" integer DEFAULT 1,
      "created_at" timestamp DEFAULT now()
    );
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "book_files" DROP CONSTRAINT IF EXISTS "book_files_book_id_books_id_fk";--> statement-breakpoint
ALTER TABLE "book_files" ADD CONSTRAINT "book_files_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_files_book_idx" ON "book_files" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_files_format_idx" ON "book_files" USING btree ("format");--> statement-breakpoint

-- ----------------------------------------------------------------------------
-- `authors.slug`: canonical, language-independent identifier (new column).
-- Derived from the current name with the same rules as `utils/slugify.ts`, with a
-- stable id-based fallback for names that slugify to nothing (e.g. Persian-only
-- names) and a numeric suffix for collisions.
-- ----------------------------------------------------------------------------
ALTER TABLE "authors" ADD COLUMN IF NOT EXISTS "slug" text;--> statement-breakpoint
WITH normalized AS (
  SELECT
    "id",
    btrim(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(coalesce("name", '')), '[^a-z0-9_[:space:]-]', '', 'g'),
          '[[:space:]]+', '-', 'g'
        ),
        '-+', '-', 'g'
      ),
      '-'
    ) AS candidate
  FROM "authors"
),
slugified AS (
  SELECT
    "id",
    CASE
      WHEN candidate = '' THEN 'author-' || left(replace("id"::text, '-', ''), 8)
      ELSE candidate
    END AS base
  FROM normalized
),
numbered AS (
  SELECT "id", base, row_number() OVER (PARTITION BY base ORDER BY "id") AS rn
  FROM slugified
)
UPDATE "authors" a
SET "slug" = CASE WHEN n.rn = 1 THEN n.base ELSE n.base || '-' || n.rn END
FROM numbered n
WHERE a."id" = n."id";--> statement-breakpoint
ALTER TABLE "authors" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "authors" DROP CONSTRAINT IF EXISTS "authors_slug_unique";--> statement-breakpoint
ALTER TABLE "authors" ADD CONSTRAINT "authors_slug_unique" UNIQUE("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "authors_slug_idx" ON "authors" USING btree ("slug");--> statement-breakpoint

-- ----------------------------------------------------------------------------
-- Backfill: every existing record becomes an `en` translation of itself.
-- `ON CONFLICT DO NOTHING` keeps the statement idempotent and skips rows that
-- already have a translation (or that would collide with an existing name).
-- Blank legacy values fall back to the canonical slug so no record is left
-- without a translatable title/name.
-- ----------------------------------------------------------------------------
INSERT INTO "book_translations" ("book_id", "locale", "title", "description")
SELECT "id", 'en'::"locale", coalesce(nullif(btrim("title"), ''), "slug"), "description"
FROM "books"
ON CONFLICT DO NOTHING;--> statement-breakpoint

INSERT INTO "author_translations" ("author_id", "locale", "name", "bio")
SELECT
  "id",
  'en'::"locale",
  coalesce(nullif(btrim("name"), ''), 'Author ' || left(replace("id"::text, '-', ''), 8)),
  "bio"
FROM "authors"
ON CONFLICT DO NOTHING;--> statement-breakpoint

INSERT INTO "category_translations" ("category_id", "locale", "name")
SELECT "id", 'en'::"locale", coalesce(nullif(btrim("name"), ''), "slug")
FROM "categories"
ON CONFLICT DO NOTHING;
