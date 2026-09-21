/**
 * Integration test: real PostgreSQL (PGlite, in-memory) behind Drizzle, so genuine
 * constraint violations flow through the repository and the action error handler.
 *
 * Run: npm test  (uses --experimental-test-module-mocks to swap the Neon client for PGlite)
 */
import * as schema from '@/db/schema';
import { AppError } from '@/lib/errors/app-error';
import { handleActionError } from '@/lib/errors/error-handler';
import { PGlite } from '@electric-sql/pglite';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import { drizzle } from 'drizzle-orm/pglite';
import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, describe, it, mock } from 'node:test';

const client = new PGlite();
const testDb = drizzle({ client, schema });

type Statement = { execute: () => Promise<unknown> };

/**
 * The PGlite driver has no `batch()` — and the production `neon-http` driver has no
 * `transaction()`. The repository expresses "write these atomically" with `batch()`, so the test
 * driver gets one implemented on a real PostgreSQL transaction (BEGIN/COMMIT/ROLLBACK), which means
 * the atomicity of `createBook` is genuinely exercised here.
 */
const dbWithBatch = Object.assign(testDb, {
  batch: async (statements: readonly Statement[]) => {
    await client.exec('BEGIN');
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.execute());
      await client.exec('COMMIT');
      return results;
    } catch (error) {
      await client.exec('ROLLBACK');
      throw error;
    }
  },
});

// Replace `@/db` (Neon) with the PGlite instance BEFORE the repository is loaded.
mock.module(path.resolve('db/index.ts'), { namedExports: { db: dbWithBatch } });

let booksMutations: typeof import('@/db/books/mutations');
let booksQueries: typeof import('@/db/books/queries');
let categoriesMutations: typeof import('@/db/categories/mutations');
let authorsQueries: typeof import('@/db/authors/queries');

let authorId: string;
let categoryId: string;

const validInput = () => ({
  translations: {
    en: { title: 'Clean Code', description: 'A handbook of agile software craftsmanship' },
    fa: { title: 'کد تمیز', description: 'راهنمای صنعتگری چابک نرم‌افزار' },
  },
  language: 'English',
  authorId,
  categoriesIds: [categoryId],
  bookFiles: [{ format: 'pdf' as const, fileUrl: 'https://example.com/clean-code.pdf' }],
});

const expectAppError = async (promise: Promise<unknown>, code: string) => {
  try {
    await promise;
    assert.fail(`expected ${code}`);
  } catch (error) {
    assert.ok(error instanceof AppError, `expected AppError, got ${String(error)}`);
    assert.equal(error.code, code, String((error.cause as Error)?.cause ?? error.cause ?? ''));
    return error;
  }
};

const countRows = async (table: 'books' | 'book_translations') =>
  (await client.query<{ count: string }>(`SELECT count(*)::text AS count FROM ${table}`)).rows[0]
    .count;

describe('books repository (PGlite)', () => {
  before(async () => {
    booksMutations = await import('@/db/books/mutations');
    booksQueries = await import('@/db/books/queries');
    categoriesMutations = await import('@/db/categories/mutations');
    authorsQueries = await import('@/db/authors/queries');
    // Build the schema straight from db/schema.ts (the project deploys with `drizzle-kit push`,
    // and the checked-in SQL migrations lag behind the schema file).
    const statements = await generateMigration(
      generateDrizzleJson({}),
      generateDrizzleJson(schema)
    );
    for (const stmt of statements) await client.exec(stmt);

    [{ id: authorId }] = await testDb
      .insert(schema.authors)
      .values({ slug: 'robert-c-martin' })
      .returning();
    await testDb.insert(schema.authorTranslations).values([
      { authorId, locale: 'en', name: 'Robert C. Martin' },
      { authorId, locale: 'fa', name: 'رابرت سی. مارتین' },
    ]);

    categoryId = (
      await categoriesMutations.createCategory({
        en: { name: 'Software' },
        fa: { name: 'نرم‌افزار' },
      })
    ).id;
  });

  after(async () => {
    await client.close();
  });

  it('creates a book with one translation per locale and generates a slug', async () => {
    const book = await booksMutations.createBook(validInput());
    // Slug comes from the fallback-locale title, so every locale shares one canonical URL.
    assert.equal(book.slug, 'clean-code');
    assert.equal((await booksQueries.listBooks('en')).length, 1);

    const translations = await booksQueries.getBookTranslations(book.id);
    assert.deepEqual(
      translations.map((t) => [t.locale, t.title]),
      [
        ['en', 'Clean Code'],
        ['fa', 'کد تمیز'],
      ]
    );
  });

  it('auto-suffixes generated slugs, but rejects an explicit duplicate slug', async () => {
    const second = await booksMutations.createBook(validInput());
    assert.equal(second.slug, 'clean-code-1');

    const error = await expectAppError(
      booksMutations.createBook({ ...validInput(), slug: 'clean-code' }),
      'BOOK_SLUG_EXISTS'
    );
    assert.deepEqual(error.fields, { slug: 'BOOK_SLUG_EXISTS' });
    // The raw PostgreSQL error is preserved server-side for logging...
    assert.ok(error.cause);
    // ...but the client payload contains only the code + field.
    assert.deepEqual(handleActionError(error), {
      success: false,
      error: { code: 'BOOK_SLUG_EXISTS', fields: { slug: 'BOOK_SLUG_EXISTS' } },
    });
  });

  it('rolls the whole create back when the translation write fails', async () => {
    const booksBefore = await countRows('books');
    // Make the translation insert fail; the book row inserted in the same batch must not survive.
    await client.exec(
      'ALTER TABLE book_translations ADD CONSTRAINT test_block_insert CHECK (false) NOT VALID'
    );
    try {
      await expectAppError(booksMutations.createBook(validInput()), 'BOOK_CREATE_FAILED');
      assert.equal(await countRows('books'), booksBefore);
    } finally {
      await client.exec('ALTER TABLE book_translations DROP CONSTRAINT test_block_insert');
    }
    assert.equal(await countRows('books'), booksBefore);
  });

  it('maps a foreign-key violation on author to a field error', async () => {
    const error = await expectAppError(
      booksMutations.createBook({
        ...validInput(),
        authorId: '00000000-0000-4000-8000-000000000000',
      }),
      'VALIDATION_ERROR'
    );
    assert.deepEqual(error.fields, { authorId: 'INVALID' });
  });

  it('get / update / delete a non-existing book -> BOOK_NOT_FOUND', async () => {
    const missing = '00000000-0000-4000-8000-000000000001';
    await expectAppError(booksQueries.getBookById(missing, 'en'), 'BOOK_NOT_FOUND');
    await expectAppError(booksQueries.getBookBySlug('nope', 'en'), 'BOOK_NOT_FOUND');
    await expectAppError(
      booksMutations.updateBook(missing, { translations: { en: { title: 'Long enough' } } }),
      'BOOK_NOT_FOUND'
    );
    await expectAppError(booksMutations.deleteBook(missing), 'BOOK_NOT_FOUND');
  });

  it('update to a duplicate slug -> BOOK_SLUG_EXISTS, and updates translations in place', async () => {
    const book = await booksQueries.getBookBySlug('clean-code-1', 'en');
    const error = await expectAppError(
      booksMutations.updateBook(book.id, { slug: 'clean-code' }),
      'BOOK_SLUG_EXISTS'
    );
    assert.deepEqual(error.fields, { slug: 'BOOK_SLUG_EXISTS' });

    await booksMutations.updateBook(book.id, {
      translations: { en: { title: 'Clean Code 2nd' }, fa: { title: 'کد تمیز، ویرایش دوم' } },
    });

    const translations = await booksQueries.getBookTranslations(book.id);
    // Still one row per locale — the upsert updated instead of duplicating.
    assert.deepEqual(
      translations.map((t) => [t.locale, t.title]),
      [
        ['en', 'Clean Code 2nd'],
        ['fa', 'کد تمیز، ویرایش دوم'],
      ]
    );
    assert.equal((await booksQueries.getBookBySlug('clean-code-1', 'en')).title, 'Clean Code 2nd');
  });

  it('returns the requested locale and falls back to English', async () => {
    const book = await booksQueries.getBookBySlug('clean-code-1', 'fa');
    assert.equal(book.title, 'کد تمیز، ویرایش دوم');
    assert.equal(book.locale, 'fa');
    assert.equal(book.author?.name, 'رابرت سی. مارتین');
    assert.deepEqual(
      book.categories.map((category) => category.name),
      ['نرم‌افزار']
    );

    const english = await booksQueries.getBookBySlug('clean-code-1', 'en');
    assert.equal(english.title, 'Clean Code 2nd');
    assert.equal(english.author?.name, 'Robert C. Martin');

    // Drop the book's Persian translation: the same request must fall back to English, not go
    // blank. The AUTHOR still has a Persian translation, and each entity falls back independently.
    await client.exec(
      `DELETE FROM book_translations WHERE book_id = '${book.id}' AND locale = 'fa'`
    );
    const fallen = await booksQueries.getBookBySlug('clean-code-1', 'fa');
    assert.equal(fallen.title, 'Clean Code 2nd');
    assert.equal(fallen.locale, 'en');
    assert.equal(fallen.author?.name, 'رابرت سی. مارتین');
  });

  it('searches the translated title of the requested locale', async () => {
    await booksMutations.updateBook((await booksQueries.getBookBySlug('clean-code-1', 'en')).id, {
      translations: { fa: { title: 'شازده تمیز' } },
    });

    const persian = await booksQueries.searchBooks('شازده', 'fa');
    assert.equal(persian.total, 1);
    assert.equal(persian.items[0].slug, 'clean-code-1');

    // The English search matches both books ("Clean Code" is a prefix of "Clean Code 2nd").
    const english = await booksQueries.searchBooks('Clean Code', 'en');
    assert.equal(english.total, 2);

    // A Persian-only term does not match the English translation of the other book.
    assert.equal((await booksQueries.searchBooks('کد', 'en')).total, 0);
  });

  it('paginates without duplicating books that have several categories', async () => {
    const extraCategory = await categoriesMutations.createCategory({ en: { name: 'Testing' } });
    const book = await booksQueries.getBookBySlug('clean-code-1', 'en');
    await booksMutations.updateBook(book.id, {
      categoriesIds: [categoryId, extraCategory.id],
    });

    const page = await booksQueries.paginateBooks('en', { page: 1, pageSize: 1 });
    assert.equal(page.total, 2);
    assert.equal(page.items.length, 1);
    assert.equal(page.totalPages, 2);

    const secondPage = await booksQueries.paginateBooks('en', { page: 2, pageSize: 1 });
    assert.equal(secondPage.items.length, 1);
    assert.notEqual(secondPage.items[0].id, page.items[0].id);

    // A book with two categories still occupies exactly one row of the list.
    const all = await booksQueries.listBooks('en', { pageSize: 10 });
    assert.equal(all.length, 2);
    assert.deepEqual(all.map((item) => item.categories.length).sort(), [1, 2]);
  });

  it('delete a book referenced elsewhere -> BOOK_IN_USE (foreign key)', async () => {
    const book = await booksQueries.getBookBySlug('clean-code-1', 'en');
    const [user] = await testDb
      .insert(schema.users)
      .values({ id: 'user_1', email: 'a@b.c', firstName: 'A', lastName: 'B' })
      .returning();
    await testDb.insert(schema.favorites).values({ userId: user.id, bookId: book.id });

    await expectAppError(booksMutations.deleteBook(book.id), 'BOOK_IN_USE');

    await testDb.delete(schema.favorites);
    const deleted = await booksMutations.deleteBook(book.id);
    assert.equal(deleted.id, book.id);
    await expectAppError(booksQueries.getBookById(book.id, 'en'), 'BOOK_NOT_FOUND');

    // book_translations is ON DELETE CASCADE, so the translations went with the book.
    const orphans = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM book_translations WHERE book_id = '${book.id}'`
    );
    assert.equal(orphans.rows[0].count, '0');
  });

  it('authors and categories carry one translation per locale', async () => {
    const author = await authorsQueries.getAuthorById(authorId, 'fa');
    assert.equal(author.name, 'رابرت سی. مارتین');
    assert.equal((await authorsQueries.getAuthorTranslations(authorId)).length, 2);

    const category = await (
      await import('@/db/categories/queries')
    ).getCategoryById(categoryId, 'fa');
    assert.equal(category.name, 'نرم‌افزار');

    await assert.rejects(
      () =>
        client.exec(
          `INSERT INTO author_translations (author_id, locale, name)
           VALUES ('${authorId}', 'fa', 'تکراری')`
        ),
      /author_translations_author_id_locale_unique/
    );
  });

  it('a category name stays unique per locale', async () => {
    const error = await expectAppError(
      categoriesMutations.createCategory({ en: { name: 'Software' } }),
      'CATEGORY_NAME_EXISTS'
    );
    assert.equal(error.code, 'CATEGORY_NAME_EXISTS');
  });

  it('unexpected database failure -> domain *_FAILED code, raw error hidden from client', async () => {
    await client.exec('DROP TABLE book_files CASCADE');
    const error = await expectAppError(
      booksMutations.createBook(validInput()),
      'BOOK_CREATE_FAILED'
    );
    assert.match(String((error.cause as Error)?.message), /Failed query|does not exist/);

    const log = mock.method(console, 'error', () => {});
    const result = handleActionError(error, { operation: 'createBook' });
    log.mock.restore();

    assert.deepEqual(result, { success: false, error: { code: 'BOOK_CREATE_FAILED' } });
    assert.doesNotMatch(JSON.stringify(result), /relation|does not exist|Failed query/);
  });
});
