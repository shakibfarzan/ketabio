import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getValidationErrors } from '@/lib/errors/validation';
import { createBookSchema, updateBookSchema } from '@/lib/validators/book.schema';

describe('validation errors', () => {
  it('returns stable field codes for invalid create input', () => {
    const parsed = createBookSchema.safeParse({
      title: 'a',
      slug: 'Not A Slug',
      authorId: 'nope',
      categoriesIds: [],
      bookFiles: [],
    });
    assert.equal(parsed.success, false);
    if (parsed.success) return;
    assert.deepEqual(getValidationErrors(parsed.error), {
      title: 'TOO_SHORT',
      slug: 'INVALID_SLUG',
      description: 'REQUIRED',
      language: 'REQUIRED',
      authorId: 'INVALID_UUID',
      categoriesIds: 'REQUIRED',
      bookFiles: 'REQUIRED',
    });
  });

  it('never emits raw text as a field code', () => {
    const parsed = updateBookSchema.safeParse({});
    assert.equal(parsed.success, false);
    if (parsed.success) return;
    for (const code of Object.values(getValidationErrors(parsed.error))) {
      assert.match(code, /^[A-Z_]+$/);
    }
  });
});
