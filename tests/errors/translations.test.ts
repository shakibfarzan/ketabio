import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTranslator } from 'next-intl';
import en from '@/messages/en.json';
import fa from '@/messages/fa.json';
import { ERROR_CODES, FIELD_ERROR_CODES } from '@/lib/errors/error-codes';

const allCodes = [...Object.values(ERROR_CODES), ...Object.values(FIELD_ERROR_CODES)];

describe('error translations', () => {
  it('every code exists in both English and Persian', () => {
    for (const code of allCodes) {
      assert.ok(en.errors[code as keyof typeof en.errors], `en missing ${code}`);
      assert.ok(fa.errors[code as keyof typeof fa.errors], `fa missing ${code}`);
    }
  });

  it('the same code renders a locale-specific message', () => {
    const tEn = createTranslator({ locale: 'en', messages: en, namespace: 'errors' });
    const tFa = createTranslator({ locale: 'fa', messages: fa, namespace: 'errors' });

    assert.equal(tEn('BOOK_SLUG_EXISTS'), 'A book with this slug already exists.');
    assert.equal(tFa('BOOK_SLUG_EXISTS'), 'کتابی با این اسلاگ از قبل وجود دارد.');
    assert.equal(tEn('INTERNAL_ERROR'), 'Something went wrong. Please try again.');
    assert.equal(tFa('INTERNAL_ERROR'), 'مشکلی پیش آمد. لطفاً دوباره تلاش کنید.');
  });
});
