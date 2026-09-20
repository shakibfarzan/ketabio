/**
 * Seed + end-to-end localization check against a real PostgreSQL (PGlite, in-memory).
 */
import * as schema from '@/db/schema';
import { PGlite } from '@electric-sql/pglite';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import { drizzle } from 'drizzle-orm/pglite';
import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, describe, it, mock } from 'node:test';

const client = new PGlite();
const testDb = drizzle({ client, schema });

mock.module(path.resolve('db/index.ts'), { namedExports: { db: testDb } });

let seed: typeof import('@/db/seed').seed;
let listBooks: typeof import('@/db/books/queries').listBooks;
let searchBooks: typeof import('@/db/books/queries').searchBooks;

const counts = async () => {
  const { rows } = await client.query<{ entity: string; count: string }>(`
    SELECT 'authors' AS entity, count(*)::text AS count FROM authors
    UNION ALL SELECT 'author_translations', count(*)::text FROM author_translations
    UNION ALL SELECT 'categories', count(*)::text FROM categories
    UNION ALL SELECT 'category_translations', count(*)::text FROM category_translations
    UNION ALL SELECT 'books', count(*)::text FROM books
    UNION ALL SELECT 'book_translations', count(*)::text FROM book_translations
    UNION ALL SELECT 'book_categories', count(*)::text FROM book_categories
    ORDER BY entity
  `);
  return Object.fromEntries(rows.map((row) => [row.entity, row.count]));
};

describe('seed (PGlite)', () => {
  before(async () => {
    const statements = await generateMigration(
      generateDrizzleJson({}),
      generateDrizzleJson(schema)
    );
    for (const stmt of statements) await client.exec(stmt);
    ({ seed } = await import('@/db/seed'));
    ({ listBooks, searchBooks } = await import('@/db/books/queries'));
    await seed();
  });

  after(async () => {
    await client.close();
  });

  it('creates every entity with its translation rows', async () => {
    assert.deepEqual(await counts(), {
      authors: '3',
      author_translations: '6',
      book_categories: '6',
      book_translations: '5', // Shahnameh is intentionally English-only
      books: '3',
      categories: '4',
      category_translations: '8',
    });
  });

  it('is idempotent', async () => {
    const before = await counts();
    assert.deepEqual(await seed(), { authors: 3, categories: 4, books: 3 });
    assert.deepEqual(await counts(), before);
  });

  it('gives every book a fallback-locale translation', async () => {
    const { rows } = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM books b
       WHERE NOT EXISTS (
         SELECT 1 FROM book_translations t WHERE t.book_id = b.id AND t.locale = 'en'
       )`
    );
    assert.equal(rows[0].count, '0');
  });

  it('serves Persian content to a Persian reader and falls back where it is missing', async () => {
    const persian = await listBooks('fa', { pageSize: 10 });
    assert.equal(persian.length, 3);

    const bySlug = Object.fromEntries(persian.map((book) => [book.slug, book]));
    assert.equal(bySlug['the-little-prince'].title, 'شازده کوچولو');
    assert.equal(bySlug['the-little-prince'].locale, 'fa');
    assert.equal(bySlug['the-little-prince'].author?.name, 'آنتوان دو سنت اگزوپری');
    assert.deepEqual(
      bySlug['the-little-prince'].categories.map((category) => category.name),
      ['کلاسیک', 'داستان']
    );

    // Shahnameh has no Persian translation row, so the fallback locale is reported.
    assert.equal(bySlug['shahnameh'].title, 'Shahnameh');
    assert.equal(bySlug['shahnameh'].locale, 'en');
  });

  it('serves English content to an English reader', async () => {
    const english = await listBooks('en', { pageSize: 10 });
    const titles = english.map((book) => book.title).sort();
    assert.deepEqual(titles, ['A Wizard of Earthsea', 'Shahnameh', 'The Little Prince']);
    assert.ok(english.every((book) => book.locale === 'en'));
  });

  it('finds books by their Persian title', async () => {
    const persian = await searchBooks('شازده', 'fa');
    assert.equal(persian.total, 1);
    assert.equal(persian.items[0].slug, 'the-little-prince');

    const english = await searchBooks('wizard', 'en');
    assert.equal(english.total, 1);
    assert.equal(english.items[0].slug, 'a-wizard-of-earthsea');
  });
});
