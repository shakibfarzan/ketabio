-- NOTE: this migration originally declared `book_files.book_id` as `integer` while `books.id` is
-- `uuid`, so its foreign key could never be created and the migration always failed half-way
-- (leaving the enum and possibly the table behind). It has been rewritten to be idempotent so
-- `drizzle-kit migrate` can get past it on databases that were partially set up by an earlier
-- run or by `drizzle-kit push`. `0002_add_translation_tables.sql` recreates `book_files` with
-- the correct column type and adds the foreign key.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'book_format' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE "public"."book_format" AS ENUM('pdf', 'epub', 'mobi', 'audio');
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "book_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"format" "book_format" NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_files_book_idx" ON "book_files" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "book_files_format_idx" ON "book_files" USING btree ("format");
