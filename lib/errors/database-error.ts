/**
 * PostgreSQL / Drizzle error detection.
 *
 * Drizzle (>= 0.44) wraps every failed query in a `DrizzleQueryError` whose `cause` is the
 * driver error (`NeonDbError` for `@neondatabase/serverless`). The driver error carries the
 * SQLSTATE in `code` and the violated constraint in `constraint`. These helpers walk the
 * `cause` chain so callers never need to know how deep the real error is buried.
 *
 * This module is locale-independent and must never import next-intl.
 */

export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
} as const;

export type PgErrorCode = (typeof PG_ERROR_CODES)[keyof typeof PG_ERROR_CODES];

export type PostgresError = {
  code: string;
  constraint?: string;
  table?: string;
  column?: string;
  detail?: string;
};

const SQLSTATE_PATTERN = /^[0-9A-Z]{5}$/;

const looksLikePostgresError = (value: unknown): value is PostgresError =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { code?: unknown }).code === 'string' &&
  SQLSTATE_PATTERN.test((value as { code: string }).code);

/**
 * Finds the underlying PostgreSQL error (if any) by walking the `cause` chain.
 * Returns `null` for non-database errors.
 */
export const getPostgresError = (error: unknown): PostgresError | null => {
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    if (looksLikePostgresError(current)) return current;
    current = (current as { cause?: unknown }).cause;
  }

  return null;
};

export const isPostgresError = (error: unknown, code: PgErrorCode): boolean =>
  getPostgresError(error)?.code === code;

export const isUniqueViolation = (error: unknown, constraint?: string) =>
  isPostgresError(error, PG_ERROR_CODES.UNIQUE_VIOLATION) &&
  (constraint === undefined || getPostgresError(error)?.constraint === constraint);

export const isForeignKeyViolation = (error: unknown, constraint?: string) =>
  isPostgresError(error, PG_ERROR_CODES.FOREIGN_KEY_VIOLATION) &&
  (constraint === undefined || getPostgresError(error)?.constraint === constraint);

export const isNotNullViolation = (error: unknown) =>
  isPostgresError(error, PG_ERROR_CODES.NOT_NULL_VIOLATION);

export const isCheckViolation = (error: unknown) =>
  isPostgresError(error, PG_ERROR_CODES.CHECK_VIOLATION);

/** Name of the violated constraint, e.g. `books_slug_unique`. */
export const getViolatedConstraint = (error: unknown): string | undefined =>
  getPostgresError(error)?.constraint;
