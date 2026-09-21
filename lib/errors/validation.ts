import type { ZodError } from 'zod';
import { FIELD_ERROR_CODES, isErrorMessageKey, type FieldErrors } from './error-codes';

/**
 * Converts a ZodError into `{ field: CODE }`.
 *
 * Server-side schemas use codes from `FIELD_ERROR_CODES` as their `message` (see
 * `lib/validators/book.schema.ts`). Any message that is not a known code is replaced with the
 * generic `INVALID` code, so untranslated/raw text never leaks to the client.
 * Nested paths are joined with dots (`translations.en.title`) so per-locale fields keep their own
 * error slot. Only the first issue per field is kept.
 */
export const getValidationErrors = (error: ZodError): FieldErrors => {
  const fields: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.map(String).join('.') : '_form';
    if (field in fields) continue;
    fields[field] = isErrorMessageKey(issue.message) ? issue.message : FIELD_ERROR_CODES.INVALID;
  }

  return fields;
};
