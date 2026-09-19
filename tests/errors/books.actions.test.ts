/**
 * Server Action tests: auth + validation + error shaping, with Clerk/Next/uploads mocked.
 */
import assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it, mock } from 'node:test';
import { ConflictError } from '@/lib/errors/app-error';
import { DrizzleQueryError } from 'drizzle-orm/errors';

type Actions = typeof import('@/app/admin/books/actions');

let currentUser: { role: 'admin' | 'member' } | null = null;
let repoCreate: (...args: unknown[]) => Promise<unknown> = async () => ({ id: 'b1', slug: 'x' });

mock.module(path.resolve('utils/auth.ts'), {
  namedExports: {
    requireAdmin: async () => {
      const { UnauthorizedError, ForbiddenError } = await import('@/lib/errors/app-error');
      if (!currentUser) throw new UnauthorizedError();
      if (currentUser.role !== 'admin') throw new ForbiddenError();
      return currentUser;
    },
  },
});
mock.module(path.resolve('utils/config-files.ts'), {
  namedExports: { uploadFile: async () => 'https://cdn.example.com/file' },
});
mock.module('next/cache', { namedExports: { revalidatePath: () => {} } });
mock.module(path.resolve('db/books.ts'), {
  namedExports: {
    createBook: (...args: unknown[]) => repoCreate(...args),
    updateBook: async () => {
      throw new Error('should not be called');
    },
    deleteBook: async () => {
      throw new Error('should not be called');
    },
    getBookBySlug: async () => {
      throw new Error('should not be called');
    },
    listBooks: async () => [],
  },
});

const validForm = () => {
  const fd = new FormData();
  fd.set('title', 'Clean Code');
  fd.set('description', 'desc');
  fd.set('language', 'English');
  fd.set('authorId', '00000000-0000-4000-8000-000000000000');
  fd.set('categoryId', '00000000-0000-4000-8000-000000000001');
  fd.set('coverImage', new File(['x'], 'cover.png', { type: 'image/png' }));
  fd.set('bookFile', new File(['x'], 'book.pdf', { type: 'application/pdf' }));
  return fd;
};

describe('books server actions', () => {
  let actions: Actions;
  before(async () => {
    actions = await import('@/app/admin/books/actions');
  });

  it('unauthorized request -> UNAUTHORIZED', async () => {
    currentUser = null;
    assert.deepEqual(await actions.createBookAction(validForm()), {
      success: false,
      error: { code: 'UNAUTHORIZED' },
    });
    assert.deepEqual(await actions.deleteBookAction('x'), {
      success: false,
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('forbidden request -> FORBIDDEN', async () => {
    currentUser = { role: 'member' };
    assert.deepEqual(await actions.updateBookAction('x', {}), {
      success: false,
      error: { code: 'FORBIDDEN' },
    });
  });

  it('invalid input -> VALIDATION_ERROR with field codes (uploads skipped)', async () => {
    currentUser = { role: 'admin' };
    const fd = validForm();
    fd.set('title', 'a');
    fd.set('authorId', 'not-a-uuid');
    fd.delete('categoryId');
    assert.deepEqual(await actions.createBookAction(fd), {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        fields: { title: 'TOO_SHORT', authorId: 'INVALID_UUID', categoryId: 'REQUIRED' },
      },
    });

    const noFiles = new FormData();
    noFiles.set('title', 'Clean Code');
    const result = await actions.createBookAction(noFiles);
    assert.equal(result.success, false);
    if (result.success) return;
    assert.deepEqual(result.error.fields, { coverImage: 'REQUIRED', bookFile: 'REQUIRED' });
  });

  it('successful creation', async () => {
    currentUser = { role: 'admin' };
    const result = await actions.createBookAction(validForm());
    assert.deepEqual(result, { success: true, data: { id: 'b1', slug: 'x' } });
  });

  it('duplicate slug -> field-level BOOK_SLUG_EXISTS', async () => {
    currentUser = { role: 'admin' };
    repoCreate = async () => {
      throw new ConflictError('BOOK_SLUG_EXISTS', { fields: { slug: 'BOOK_SLUG_EXISTS' } });
    };
    assert.deepEqual(await actions.createBookAction(validForm()), {
      success: false,
      error: { code: 'BOOK_SLUG_EXISTS', fields: { slug: 'BOOK_SLUG_EXISTS' } },
    });
  });

  it('raw Drizzle error escaping the repository -> INTERNAL_ERROR, nothing leaked', async () => {
    currentUser = { role: 'admin' };
    repoCreate = async () => {
      throw new DrizzleQueryError('insert into "books" (...)', ['Clean Code'], new Error('boom'));
    };
    const log = mock.method(console, 'error', () => {});
    const result = await actions.createBookAction(validForm());
    log.mock.restore();

    assert.deepEqual(result, { success: false, error: { code: 'INTERNAL_ERROR' } });
    assert.equal(log.mock.callCount(), 1);
    assert.doesNotMatch(JSON.stringify(result), /insert into|Failed query|boom|Clean Code/);
  });
});
