import { books, bookFiles, bookCategories } from '@/db/schema';
import { db } from '@/db/index';
import slugify from '@/utils/slugify';
import { eq } from 'drizzle-orm';

export type Book = typeof books.$inferSelect;

type BookInsert = typeof books.$inferInsert;
type BookFileInsert = typeof bookFiles.$inferInsert;

type CreateBookInput = Omit<BookInsert, 'slug'> & {
  bookFiles: Omit<BookFileInsert, 'bookId'>[];
  categoriesIds: string[];
};

export const createBook = async (args: CreateBookInput) => {
  let slug = slugify(args.title);
  let counter = 1;

  while (
    await db.query.books.findFirst({
      where: eq(books.slug, slug),
    })
  ) {
    slug = `${slug}-${counter++}`;
  }

  const [created] = await db
    .insert(books)
    .values({ ...args, slug } as BookInsert)
    .returning();

  await db
    .insert(bookCategories)
    .values(args.categoriesIds.map((categoryId) => ({ bookId: created.id, categoryId })));

  await db
    .insert(bookFiles)
    .values(args.bookFiles.map((bookFile) => ({ bookId: created.id, ...bookFile })));

  return created;
};
