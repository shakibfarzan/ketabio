CREATE TYPE "public"."book_format" AS ENUM('pdf', 'epub', 'mobi', 'audio');--> statement-breakpoint
CREATE TABLE "book_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" integer NOT NULL,
	"format" "book_format" NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "book_files" ADD CONSTRAINT "book_files_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_files_book_idx" ON "book_files" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "book_files_format_idx" ON "book_files" USING btree ("format");