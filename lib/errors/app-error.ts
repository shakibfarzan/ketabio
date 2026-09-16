import type { ErrorCode, FieldErrors } from './error-codes';

export type AppErrorOptions = ErrorOptions & {
  /** Field-level codes when the error belongs to specific form fields. */
  fields?: FieldErrors;
};

/**
 * Base application error. Carries a stable `code` (never a translated message).
 * The `cause` keeps the original (e.g. Drizzle/PostgreSQL) error for server-side logs only.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fields?: FieldErrors;

  constructor(code: ErrorCode, options?: AppErrorOptions) {
    super(code, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'AppError';
    this.code = code;
    this.fields = options?.fields;
  }
}

export class NotFoundError extends AppError {
  constructor(code: ErrorCode = 'NOT_FOUND', options?: AppErrorOptions) {
    super(code, options);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(code: ErrorCode = 'CONFLICT', options?: AppErrorOptions) {
    super(code, options);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(code: ErrorCode = 'UNAUTHORIZED', options?: AppErrorOptions) {
    super(code, options);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(code: ErrorCode = 'FORBIDDEN', options?: AppErrorOptions) {
    super(code, options);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(fields: FieldErrors, options?: ErrorOptions) {
    super('VALIDATION_ERROR', { ...options, fields });
    this.name = 'ValidationError';
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;
