import type { ErrorCode, FieldErrors } from '@/lib/errors/error-codes';

export type ActionError = {
  code: ErrorCode;
  /** Present when the error belongs to specific form fields. Values are translatable codes. */
  fields?: FieldErrors;
};

/**
 * Uniform return type for every Server Action that can fail.
 * Only stable codes cross the server/client boundary; the UI translates them.
 */
export type ActionResult<T> = { success: true; data: T } | { success: false; error: ActionError };

export const ok = <T>(data: T): ActionResult<T> => ({ success: true, data });

export const fail = (code: ErrorCode, fields?: FieldErrors): ActionResult<never> => ({
  success: false,
  error: fields && Object.keys(fields).length > 0 ? { code, fields } : { code },
});
