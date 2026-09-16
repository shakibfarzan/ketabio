import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import {
  getPostgresError,
  isForeignKeyViolation,
  isNotNullViolation,
  isUniqueViolation,
} from '@/lib/errors/database-error';

const pgError = (code: string, constraint?: string) =>
  Object.assign(new Error('duplicate key value violates unique constraint'), { code, constraint });

describe('database-error normalization', () => {
  it('detects a raw postgres unique violation', () => {
    const error = pgError('23505', 'books_slug_unique');
    assert.equal(isUniqueViolation(error), true);
    assert.equal(isUniqueViolation(error, 'books_slug_unique'), true);
    assert.equal(isUniqueViolation(error, 'categories_slug_unique'), false);
  });

  it('walks the DrizzleQueryError cause chain', () => {
    const wrapped = new DrizzleQueryError('insert into books', [], pgError('23503', 'fk'));
    assert.equal(isForeignKeyViolation(wrapped), true);
    assert.equal(isForeignKeyViolation(wrapped, 'fk'), true);
    assert.equal(getPostgresError(wrapped)?.constraint, 'fk');
  });

  it('ignores non-database errors', () => {
    assert.equal(getPostgresError(new Error('boom')), null);
    assert.equal(getPostgresError(null), null);
    assert.equal(getPostgresError('x'), null);
    assert.equal(isNotNullViolation({ code: 'ECONNREFUSED' }), false);
  });
});
