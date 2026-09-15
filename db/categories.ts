import { db } from '@/db';
import { bookCategories, categories } from '@/db/schema';
import slugify from '@/utils/slugify';
import { asc, eq } from 'drizzle-orm';

export type Category = typeof categories.$inferSelect;

const uniqueSlug = async (name: string, excludedId?: string) => {
  const baseSlug = slugify(name) || 'category';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });

    if (!existing || existing.id === excludedId) return slug;
    slug = `${baseSlug}-${counter++}`;
  }
};

export const getCategories = () => db.select().from(categories).orderBy(asc(categories.name));

export const getCategoryById = (id: string) =>
  db.query.categories.findFirst({ where: eq(categories.id, id) });

export const createCategory = async (name: string) => {
  const slug = await uniqueSlug(name);
  const [category] = await db.insert(categories).values({ name, slug }).returning();
  return category;
};

export const updateCategory = async (id: string, name: string) => {
  const slug = await uniqueSlug(name, id);
  const [category] = await db
    .update(categories)
    .set({ name, slug })
    .where(eq(categories.id, id))
    .returning();
  return category;
};

export const deleteCategory = async (id: string) => {
  const [, deletedCategories] = await db.batch([
    db.delete(bookCategories).where(eq(bookCategories.categoryId, id)),
    db.delete(categories).where(eq(categories.id, id)).returning(),
  ]);

  return deletedCategories[0];
};
