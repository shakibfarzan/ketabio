import { books } from '@/db/schema';
import { db } from '@/db/index';
import slugify from '@/utils/slugify';
import { eq } from 'drizzle-orm';

export type Book = typeof books.$inferSelect;

type BookInsert = typeof books.$inferInsert;

export const createBook = async (args: Omit<BookInsert, 'slug'>) => {
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
  return created;
};
