/**
 * Migration test: replays the checked-in SQL migrations against a real PostgreSQL
 * (PGlite, in-memory) that already holds legacy single-language data, then checks that
 * `0002` + `0003` move that data into the translation tables without losing records.
 */
import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';

const MIGRATIONS_DIR = path.resolve('drizzle');

const client = new PGlite();

/** Runs a drizzle migration file, splitting on its statement breakpoints. */
const runMigration = async (tag: string) => {
  const file = fs
    .readdirSync(MIGRATIONS_DIR)
    .find((name) => name.startsWith(tag) && name.endsWith('.sql'));
  assert.ok(file, `missing migration ${tag}`);
  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file as string), 'utf8');
  for (const statement of sql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim();
    if (trimmed) await client.exec(trimmed);
  }
};

const query = async <T>(sql: string): Promise<T[]> => (await client.query<T>(sql)).rows;

const columnExists = async (table: string, column: string) =>
  (
    await query<{ found: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = '${table}' AND column_name = '${column}'
       ) AS found`
    )
  )[0].found;

describe('multilingual migrations (PGlite)', () => {
  before(async () => {
    // Legacy database: `0000` + `0001`, tolerating the documented `book_files` FK failure
    // (integer vs uuid — see the comment in `0002_add_translation_tables.sql`).
    for (const tag of ['0000', '0001']) {
      const file = fs
        .readdirSync(MIGRATIONS_DIR)
        .find((name) => name.startsWith(tag) && name.endsWith('.sql')) as string;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      for (const statement of sql.split('--> statement-breakpoint')) {
        const trimmed = statement.trim();
        if (!trimmed) continue;
        try {
          await client.exec(trimmed);
        } catch (error) {
          // `0001` is the only known-broken migration; anything else is a real failure.
          if (!/cannot be implemented/.test((error as Error).message)) throw error;
        }
      }
    }

    // Legacy single-language content, including awkward rows the migration must survive.
    await client.exec(`
      INSERT INTO authors (id, name, bio) VALUES
        ('11111111-1111-4111-8111-111111111111', 'Antoine de Saint-Exupery', 'French writer'),
        ('22222222-2222-4222-8222-222222222222', 'احمد شاملو', NULL),
        ('33333333-3333-4333-8333-333333333333', 'Antoine de Saint-Exupery', 'duplicate name');

      INSERT INTO categories (id, name, slug) VALUES
        ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Fiction', 'fiction'),
        ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Science', 'science');

      INSERT INTO books (id, title, slug, description, language, author_id) VALUES
        ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'The Little Prince', 'the-little-prince',
         'A novella', 'French', '11111111-1111-4111-8111-111111111111'),
        ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '   ', 'blank-title', 'No title here', 'English',
         '22222222-2222-4222-8222-222222222222'),
        ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Shahnameh', 'shahnameh', NULL,
         'Persian', '22222222-2222-4222-8222-222222222222');

      INSERT INTO book_categories (book_id, category_id) VALUES
        ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
        ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    `);

    await runMigration('0002');
  });

  after(async () => {
    await client.close();
  });

  it('creates one en translation per legacy record', async () => {
    const books = await query<{ count: string }>('SELECT count(*)::text AS count FROM books');
    const translations = await query<{ count: string }>(
      "SELECT count(*)::text AS count FROM book_translations WHERE locale = 'en'"
    );
    assert.equal(books[0].count, '3');
    assert.equal(translations[0].count, '3');

    const littlePrince = await query<{ title: string; description: string | null }>(
      "SELECT title, description FROM book_translations WHERE book_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'"
    );
    assert.equal(littlePrince[0].title, 'The Little Prince');
    assert.equal(littlePrince[0].description, 'A novella');
  });

  it('falls back to the slug when the legacy title is blank', async () => {
    const [row] = await query<{ title: string }>(
      "SELECT title FROM book_translations WHERE book_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'"
    );
    assert.equal(row.title, 'blank-title');
  });

  it('gives every author a unique slug, even for non-Latin and duplicate names', async () => {
    const slugs = await query<{ slug: string }>('SELECT slug FROM authors ORDER BY slug');
    assert.deepEqual(
      slugs.map((s) => s.slug),
      ['antoine-de-saint-exupery', 'antoine-de-saint-exupery-2', 'author-22222222']
    );

    const names = await query<{ name: string }>(
      'SELECT name FROM author_translations ORDER BY name'
    );
    assert.deepEqual(
      names.map((n) => n.name),
      ['Antoine de Saint-Exupery', 'Antoine de Saint-Exupery', 'احمد شاملو']
    );
  });

  it('migrates categories and keeps the book/category links', async () => {
    const names = await query<{ name: string }>(
      'SELECT name FROM category_translations ORDER BY name'
    );
    assert.deepEqual(
      names.map((n) => n.name),
      ['Fiction', 'Science']
    );

    const links = await query<{ count: string }>(
      'SELECT count(*)::text AS count FROM book_categories'
    );
    assert.equal(links[0].count, '2');
  });

  it('is idempotent: re-running phase 1 adds nothing', async () => {
    await runMigration('0002');
    const [row] = await query<{ count: string }>(
      'SELECT count(*)::text AS count FROM book_translations'
    );
    assert.equal(row.count, '3');
  });

  it('phase 2 refuses to run while a record has no translation', async () => {
    await client.exec(
      `INSERT INTO books (id, title, slug, description, language)
       VALUES ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'Orphan', 'orphan', '', 'English')`
    );
    await assert.rejects(() => runMigration('0003'), /no translation row/);
    assert.equal(await columnExists('books', 'title'), true);
  });

  it('phase 2 drops the legacy columns and keeps every record', async () => {
    await client.exec(`DELETE FROM books WHERE id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'`);
    await runMigration('0003');

    assert.equal(await columnExists('books', 'title'), false);
    assert.equal(await columnExists('books', 'description'), false);
    assert.equal(await columnExists('authors', 'name'), false);
    assert.equal(await columnExists('authors', 'bio'), false);
    assert.equal(await columnExists('categories', 'name'), false);

    const counts = await query<{
      books: string;
      translations: string;
      authors: string;
      links: string;
    }>(
      `SELECT
         (SELECT count(*)::text FROM books) AS books,
         (SELECT count(*)::text FROM book_translations) AS translations,
         (SELECT count(*)::text FROM authors) AS authors,
         (SELECT count(*)::text FROM book_categories) AS links`
    );
    assert.deepEqual(counts[0], { books: '3', translations: '3', authors: '3', links: '2' });
  });

  it('a translation can be added per locale and is rejected twice for the same locale', async () => {
    await client.exec(
      `INSERT INTO book_translations (book_id, locale, title)
       VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'fa', 'شازده کوچولو')`
    );
    await assert.rejects(
      () =>
        client.exec(
          `INSERT INTO book_translations (book_id, locale, title)
           VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'fa', 'دوباره')`
        ),
      /book_translations_book_id_locale_unique/
    );

    const rows = await query<{ locale: string }>(
      "SELECT locale FROM book_translations WHERE book_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' ORDER BY locale"
    );
    assert.deepEqual(
      rows.map((r) => r.locale),
      ['en', 'fa']
    );
  });

  it('deleting a book cascades to its translations', async () => {
    await client.exec(`DELETE FROM book_categories`);
    await client.exec(`DELETE FROM books WHERE id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'`);
    const rows = await query<{ count: string }>(
      "SELECT count(*)::text AS count FROM book_translations WHERE book_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'"
    );
    assert.equal(rows[0].count, '0');
  });
});
