/**
 * Integration test: real PostgreSQL (PGlite, in-memory) behind Drizzle, so genuine
 * constraint violations flow through the repository and the action error handler.
 *
 * Run: npm test  (uses --experimental-test-module-mocks to swap the Neon client for PGlite)
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, describe, it, mock } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import * as schema from '@/db/schema';
import { AppError } from '@/lib/errors/app-error';
import { handleActionError } from '@/lib/errors/error-handler';

const client = new PGlite();
const testDb = drizzle({ client, schema });

// Replace `@/db` (Neon) with the PGlite instance BEFORE the repository is loaded.
mock.module(path.resolve('db/index.ts'), { namedExports: { db: testDb } });

let books: typeof import('@/db/books');

let authorId: string;
let categoryId: string;

const validInput = () => ({
  title: 'Clean Code',
  description: 'A handbook of agile software craftsmanship',
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

describe('books repository (PGlite)', () => {
  before(async () => {
    books = await import('@/db/books');
    // Build the schema straight from db/schema.ts (the project deploys with `drizzle-kit push`,
    // and the checked-in SQL migrations lag behind the schema file).
    const statements = await generateMigration(
      generateDrizzleJson({}),
      generateDrizzleJson(schema)
    );
    for (const stmt of statements) await client.exec(stmt);
    [{ id: authorId }] = await testDb
      .insert(schema.authors)
      .values({ name: 'Robert C. Martin' })
      .returning();
    [{ id: categoryId }] = await testDb
      .insert(schema.categories)
      .values({ name: 'Software', slug: 'software' })
      .returning();
  });

  after(async () => {
    await client.close();
  });

  it('creates a book and generates a slug', async () => {
    const book = await books.createBook(validInput());
    assert.equal(book.slug, 'clean-code');
    assert.equal((await books.listBooks()).length, 1);
  });

  it('auto-suffixes generated slugs, but rejects an explicit duplicate slug', async () => {
    const second = await books.createBook(validInput());
    assert.equal(second.slug, 'clean-code-2');

    const error = await expectAppError(
      books.createBook({ ...validInput(), slug: 'clean-code' }),
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

  it('maps a foreign-key violation on author to a field error', async () => {
    const error = await expectAppError(
      books.createBook({ ...validInput(), authorId: '00000000-0000-4000-8000-000000000000' }),
      'VALIDATION_ERROR'
    );
    assert.deepEqual(error.fields, { authorId: 'INVALID' });
  });

  it('get / update / delete a non-existing book -> BOOK_NOT_FOUND', async () => {
    const missing = '00000000-0000-4000-8000-000000000001';
    await expectAppError(books.getBookById(missing), 'BOOK_NOT_FOUND');
    await expectAppError(books.getBookBySlug('nope'), 'BOOK_NOT_FOUND');
    await expectAppError(books.updateBook(missing, { title: 'x' }), 'BOOK_NOT_FOUND');
    await expectAppError(books.deleteBook(missing), 'BOOK_NOT_FOUND');
  });

  it('update to a duplicate slug -> BOOK_SLUG_EXISTS with field info', async () => {
    const book = await books.getBookBySlug('clean-code-2');
    const error = await expectAppError(
      books.updateBook(book.id, { slug: 'clean-code' }),
      'BOOK_SLUG_EXISTS'
    );
    assert.deepEqual(error.fields, { slug: 'BOOK_SLUG_EXISTS' });

    const updated = await books.updateBook(book.id, { title: 'Clean Code 2nd' });
    assert.equal(updated.title, 'Clean Code 2nd');
  });

  it('delete a book referenced elsewhere -> BOOK_IN_USE (foreign key)', async () => {
    const book = await books.getBookBySlug('clean-code-2');
    const [user] = await testDb
      .insert(schema.users)
      .values({ id: 'user_1', email: 'a@b.c', firstName: 'A', lastName: 'B' })
      .returning();
    await testDb.insert(schema.favorites).values({ userId: user.id, bookId: book.id });

    await expectAppError(books.deleteBook(book.id), 'BOOK_IN_USE');

    await testDb.delete(schema.favorites);
    const deleted = await books.deleteBook(book.id);
    assert.equal(deleted.id, book.id);
    await expectAppError(books.getBookById(book.id), 'BOOK_NOT_FOUND');
  });

  it('unexpected database failure -> domain *_FAILED code, raw error hidden from client', async () => {
    await client.exec('DROP TABLE book_files CASCADE');
    const error = await expectAppError(books.createBook(validInput()), 'BOOK_CREATE_FAILED');
    assert.match(String((error.cause as Error)?.message), /Failed query|does not exist/);

    const log = mock.method(console, 'error', () => {});
    const result = handleActionError(error, { operation: 'createBook' });
    log.mock.restore();

    assert.deepEqual(result, { success: false, error: { code: 'BOOK_CREATE_FAILED' } });
    assert.doesNotMatch(JSON.stringify(result), /relation|does not exist|Failed query/);
  });
});
