import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { DrizzleQueryError } from 'drizzle-orm/errors';
import { AppError, ConflictError, ForbiddenError, UnauthorizedError } from '@/lib/errors/app-error';
import { handleActionError } from '@/lib/errors/error-handler';

const silence = () => mock.method(console, 'error', () => {});

describe('handleActionError', () => {
  it('preserves AppError codes and fields', () => {
    const result = handleActionError(
      new ConflictError('BOOK_SLUG_EXISTS', { fields: { slug: 'BOOK_SLUG_EXISTS' } })
    );
    assert.deepEqual(result, {
      success: false,
      error: { code: 'BOOK_SLUG_EXISTS', fields: { slug: 'BOOK_SLUG_EXISTS' } },
    });
  });

  it('maps unauthorized / forbidden', () => {
    assert.deepEqual(handleActionError(new UnauthorizedError()), {
      success: false,
      error: { code: 'UNAUTHORIZED' },
    });
    assert.deepEqual(handleActionError(new ForbiddenError()), {
      success: false,
      error: { code: 'FORBIDDEN' },
    });
  });

  it('collapses unknown errors into INTERNAL_ERROR and logs them', () => {
    const log = silence();
    const result = handleActionError(new Error('relation "books" does not exist'), {
      operation: 'listBooks',
    });
    assert.deepEqual(result, { success: false, error: { code: 'INTERNAL_ERROR' } });
    assert.equal(log.mock.callCount(), 1);
    assert.match(String(log.mock.calls[0].arguments[0]), /listBooks/);
    log.mock.restore();
  });

  it('never leaks raw Drizzle/PostgreSQL text to the client', () => {
    const log = silence();
    const pg = Object.assign(new Error('duplicate key value violates unique constraint'), {
      code: '23505',
      constraint: 'books_slug_unique',
    });
    const drizzle = new DrizzleQueryError('insert into "books" ...', ['secret'], pg);

    for (const error of [drizzle, new AppError('BOOK_CREATE_FAILED', { cause: drizzle })]) {
      const serialized = JSON.stringify(handleActionError(error));
      assert.doesNotMatch(serialized, /duplicate key|constraint|insert into|Failed query|secret/);
    }
    log.mock.restore();
  });
});
