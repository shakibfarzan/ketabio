import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getValidationErrors } from '@/lib/errors/validation';
import { createBookSchema, updateBookSchema } from '@/lib/validators/book.schema';

describe('validation errors', () => {
  it('returns stable field codes for invalid create input', () => {
    const parsed = createBookSchema.safeParse({
      translations: { en: { title: 'a' } },
      slug: 'Not A Slug',
      authorId: 'nope',
      categoriesIds: [],
      bookFiles: [],
    });
    assert.equal(parsed.success, false);
    if (parsed.success) return;
    assert.deepEqual(getValidationErrors(parsed.error), {
      // Nested paths are dotted so each locale keeps its own field slot.
      'translations.en.title': 'TOO_SHORT',
      slug: 'INVALID_SLUG',
      language: 'REQUIRED',
      authorId: 'INVALID_UUID',
      categoriesIds: 'REQUIRED',
      bookFiles: 'REQUIRED',
    });
  });

  it('requires a title in the fallback locale, but not in the others', () => {
    const withoutFallback = createBookSchema.safeParse({
      translations: { fa: { title: 'شازده کوچولو' } },
      language: 'Persian',
      authorId: '00000000-0000-4000-8000-000000000000',
      categoriesIds: ['00000000-0000-4000-8000-000000000001'],
      bookFiles: [{ format: 'pdf', fileUrl: 'https://example.com/book.pdf' }],
    });
    assert.equal(withoutFallback.success, false);
    if (!withoutFallback.success) {
      assert.deepEqual(getValidationErrors(withoutFallback.error), {
        'translations.en.title': 'REQUIRED',
      });
    }

    // The same book with an English title is valid; Persian stays optional.
    const withFallback = createBookSchema.safeParse({
      translations: { en: { title: 'The Little Prince' } },
      language: 'French',
      authorId: '00000000-0000-4000-8000-000000000000',
      categoriesIds: ['00000000-0000-4000-8000-000000000001'],
      bookFiles: [{ format: 'pdf', fileUrl: 'https://example.com/book.pdf' }],
    });
    assert.equal(withFallback.success, true);
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
