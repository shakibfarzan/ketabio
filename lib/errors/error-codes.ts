/**
 * Stable, machine-readable error codes shared between server and client.
 *
 * The server never returns human-readable messages; it returns one of these codes.
 * The UI translates them through the `errors` next-intl namespace (`messages/*.json`).
 *
 * Every code listed here MUST have a translation in both `messages/en.json` and
 * `messages/fa.json` (enforced by `tests/errors/translations.test.ts`).
 */
export const ERROR_CODES = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  VALIDATION_ERROR: 'VALIDATION_ERROR',

  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  BOOK_NOT_FOUND: 'BOOK_NOT_FOUND',
  BOOK_SLUG_EXISTS: 'BOOK_SLUG_EXISTS',
  BOOK_IN_USE: 'BOOK_IN_USE',
  BOOK_CREATE_FAILED: 'BOOK_CREATE_FAILED',
  BOOK_UPDATE_FAILED: 'BOOK_UPDATE_FAILED',
  BOOK_DELETE_FAILED: 'BOOK_DELETE_FAILED',
  BOOK_FETCH_FAILED: 'BOOK_FETCH_FAILED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Codes used for field-level validation issues (Zod). They live in the same
 * `errors` translation namespace so the UI can call `t(code)` uniformly.
 */
export const FIELD_ERROR_CODES = {
  REQUIRED: 'REQUIRED',
  TOO_SHORT: 'TOO_SHORT',
  TOO_LONG: 'TOO_LONG',
  INVALID: 'INVALID',
  INVALID_SLUG: 'INVALID_SLUG',
  INVALID_UUID: 'INVALID_UUID',
  INVALID_URL: 'INVALID_URL',
  INVALID_NUMBER: 'INVALID_NUMBER',
  INVALID_DATE: 'INVALID_DATE',
  MUST_BE_INTEGER: 'MUST_BE_INTEGER',
  MUST_BE_POSITIVE: 'MUST_BE_POSITIVE',
} as const;

export type FieldErrorCode = (typeof FIELD_ERROR_CODES)[keyof typeof FIELD_ERROR_CODES];

/** Anything that can be translated with `useTranslations('errors')`. */
export type ErrorMessageKey = ErrorCode | FieldErrorCode;

/** Field name -> translatable code (e.g. `{ slug: 'BOOK_SLUG_EXISTS' }`). */
export type FieldErrors = Record<string, ErrorMessageKey>;

const ALL_MESSAGE_KEYS: ReadonlySet<string> = new Set([
  ...Object.values(ERROR_CODES),
  ...Object.values(FIELD_ERROR_CODES),
]);

export const isErrorCode = (value: unknown): value is ErrorCode =>
  typeof value === 'string' && value in ERROR_CODES;

export const isErrorMessageKey = (value: unknown): value is ErrorMessageKey =>
  typeof value === 'string' && ALL_MESSAGE_KEYS.has(value);
