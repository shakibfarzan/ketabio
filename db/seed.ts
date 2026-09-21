/**
 * Development seed: a small bilingual catalog in the translation-table shape.
 *
 *   Author   → author_translations(en, fa)
 *   Category → category_translations(en, fa)
 *   Book     → book_translations(en, fa)
 *
 * Idempotent: rows are keyed by their canonical slug and skipped when they already exist, so the
 * seed can be re-run at any time.
 *
 * Run: npm run seed   (requires DATABASE_URL)
 */
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { db } from '.';
import {
  authorTranslations,
  authors,
  bookCategories,
  bookFiles,
  bookTranslations,
  books,
  categories,
  categoryTranslations,
} from './schema';
import type { AuthorTranslationsInput } from './authors/types';
import type { BookTranslationsInput } from './books/types';
import type { CategoryTranslationsInput } from './categories/types';
import type { Locale } from '@/constants/locales';

type AuthorSeed = {
  slug: string;
  avatarUrl: string | null;
  translations: AuthorTranslationsInput;
};

type CategorySeed = {
  slug: string;
  translations: CategoryTranslationsInput;
};

type BookSeed = {
  slug: string;
  language: string;
  pageCount: number;
  publishedAt: string;
  isbn: string | null;
  author: string;
  categories: string[];
  translations: BookTranslationsInput;
};

const AUTHOR_SEED: AuthorSeed[] = [
  {
    slug: 'antoine-de-saint-exupery',
    avatarUrl: null,
    translations: {
      en: {
        name: 'Antoine de Saint-Exupéry',
        bio: 'French writer and aviator, best known for The Little Prince.',
      },
      fa: {
        name: 'آنتوان دو سنت اگزوپری',
        bio: 'نویسنده و خلبان فرانسوی، نویسنده شازده کوچولو.',
      },
    },
  },
  {
    slug: 'ferdowsi',
    avatarUrl: null,
    translations: {
      en: { name: 'Ferdowsi', bio: 'Persian poet, author of the Shahnameh.' },
      fa: { name: 'ابوالقاسم فردوسی', bio: 'شاعر بزرگ ایرانی و سراینده شاهنامه.' },
    },
  },
  {
    slug: 'ursula-k-le-guin',
    avatarUrl: null,
    translations: {
      en: { name: 'Ursula K. Le Guin', bio: 'American author of speculative fiction.' },
      fa: { name: 'اورسولا کی. لو گویین', bio: 'نویسنده آمریکایی ادبیات گمانه‌زن.' },
    },
  },
];

const CATEGORY_SEED: CategorySeed[] = [
  { slug: 'fiction', translations: { en: { name: 'Fiction' }, fa: { name: 'داستان' } } },
  { slug: 'fantasy', translations: { en: { name: 'Fantasy' }, fa: { name: 'فانتزی' } } },
  { slug: 'poetry', translations: { en: { name: 'Poetry' }, fa: { name: 'شعر' } } },
  { slug: 'classics', translations: { en: { name: 'Classics' }, fa: { name: 'کلاسیک' } } },
];

const BOOK_SEED: BookSeed[] = [
  {
    slug: 'the-little-prince',
    language: 'French',
    pageCount: 96,
    publishedAt: '1943-04-06',
    isbn: '978-0156012195',
    author: 'antoine-de-saint-exupery',
    categories: ['fiction', 'classics'],
    translations: {
      en: {
        title: 'The Little Prince',
        description: 'A pilot stranded in the desert meets a young prince from another planet.',
      },
      fa: {
        title: 'شازده کوچولو',
        description:
          'خلبانی که در بیابان گرفتار شده با شاهزاده‌ای کوچک از سیاره‌ای دیگر دیدار می‌کند.',
      },
    },
  },
  {
    slug: 'shahnameh',
    language: 'Persian',
    pageCount: 800,
    publishedAt: '1010-01-01',
    isbn: null,
    author: 'ferdowsi',
    categories: ['poetry', 'classics'],
    translations: {
      // English only, on purpose: a Persian UI falls back to this title.
      en: {
        title: 'Shahnameh',
        description:
          'The Persian national epic, from the creation of the world to the Arab conquest.',
      },
    },
  },
  {
    slug: 'a-wizard-of-earthsea',
    language: 'English',
    pageCount: 183,
    publishedAt: '1968-01-01',
    isbn: '978-0553383041',
    author: 'ursula-k-le-guin',
    categories: ['fiction', 'fantasy'],
    translations: {
      en: {
        title: 'A Wizard of Earthsea',
        description: 'Ged, a young sorcerer, confronts the shadow he released into the world.',
      },
      fa: {
        title: 'جادوگر زمین‌دریا',
        description: 'گد، جادوگر جوان، با سایه‌ای که به جهان رهانده روبه‌رو می‌شود.',
      },
    },
  },
];

/** Inserts by canonical slug, or returns the id of the row that already exists. */
const ensureAuthor = async ({ slug, avatarUrl }: AuthorSeed): Promise<string> => {
  const [created] = await db
    .insert(authors)
    .values({ slug, avatarUrl })
    .onConflictDoNothing({ target: authors.slug })
    .returning({ id: authors.id });
  if (created) return created.id;

  const [existing] = await db
    .select({ id: authors.id })
    .from(authors)
    .where(eq(authors.slug, slug));
  return existing.id;
};

const ensureCategory = async ({ slug }: CategorySeed): Promise<string> => {
  const [created] = await db
    .insert(categories)
    .values({ slug })
    .onConflictDoNothing({ target: categories.slug })
    .returning({ id: categories.id });
  if (created) return created.id;

  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug));
  return existing.id;
};

const ensureBook = async (
  seedBook: BookSeed,
  authorId: string
): Promise<{ id: string; isNew: boolean }> => {
  const [created] = await db
    .insert(books)
    .values({
      slug: seedBook.slug,
      language: seedBook.language,
      pageCount: seedBook.pageCount,
      publishedAt: new Date(seedBook.publishedAt),
      isbn: seedBook.isbn,
      coverImage: '/Book-Cover-Template.png',
      authorId,
    })
    .onConflictDoNothing({ target: books.slug })
    .returning({ id: books.id });
  if (created) return { id: created.id, isNew: true };

  const [existing] = await db
    .select({ id: books.id })
    .from(books)
    .where(eq(books.slug, seedBook.slug));
  return { id: existing.id, isNew: false };
};

export const seed = async () => {
  const authorIds = new Map<string, string>();
  const categoryIds = new Map<string, string>();

  for (const author of AUTHOR_SEED) {
    const id = await ensureAuthor(author);
    authorIds.set(author.slug, id);

    await db
      .insert(authorTranslations)
      .values(
        (
          Object.entries(author.translations) as [
            Locale,
            NonNullable<AuthorSeed['translations'][Locale]>,
          ][]
        ).map(([locale, value]) => ({
          authorId: id,
          locale,
          name: value.name,
          bio: value.bio ?? null,
        }))
      )
      .onConflictDoNothing({ target: [authorTranslations.authorId, authorTranslations.locale] });
  }

  for (const category of CATEGORY_SEED) {
    const id = await ensureCategory(category);
    categoryIds.set(category.slug, id);

    await db
      .insert(categoryTranslations)
      .values(
        (Object.entries(category.translations) as [Locale, { name: string }][]).map(
          ([locale, value]) => ({ categoryId: id, locale, name: value.name })
        )
      )
      .onConflictDoNothing({
        target: [categoryTranslations.categoryId, categoryTranslations.locale],
      });
  }

  for (const seedBook of BOOK_SEED) {
    const authorId = authorIds.get(seedBook.author);
    if (!authorId) continue;

    const { id, isNew } = await ensureBook(seedBook, authorId);

    await db
      .insert(bookTranslations)
      .values(
        (
          Object.entries(seedBook.translations) as [
            Locale,
            { title: string; description?: string | null },
          ][]
        ).map(([locale, value]) => ({
          bookId: id,
          locale,
          title: value.title,
          description: value.description ?? null,
        }))
      )
      .onConflictDoNothing({ target: [bookTranslations.bookId, bookTranslations.locale] });

    const links = seedBook.categories.flatMap((slug) => {
      const categoryId = categoryIds.get(slug);
      return categoryId ? [{ bookId: id, categoryId }] : [];
    });
    if (links.length > 0) {
      await db
        .insert(bookCategories)
        .values(links)
        .onConflictDoNothing({ target: [bookCategories.bookId, bookCategories.categoryId] });
    }

    // book_files has no natural key, so it is only written for books this run created.
    if (isNew) {
      await db.insert(bookFiles).values({
        bookId: id,
        format: 'pdf',
        fileUrl: `https://example.com/seed/${seedBook.slug}.pdf`,
      });
    }
  }

  return {
    authors: AUTHOR_SEED.length,
    categories: CATEGORY_SEED.length,
    books: BOOK_SEED.length,
  };
};

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  seed()
    .then((counts) => {
      console.log('Seeded:', counts);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}
