import { unstable_rethrow } from 'next/navigation';
import { fail, type ActionResult } from '@/types/action-result';
import { AppError } from './app-error';
import { getPostgresError } from './database-error';

type ErrorContext = {
  /** Name of the failing action/repository call, e.g. `createBook`. */
  operation?: string;
};

/**
 * Serializes an error for server logs. Keeps the useful parts (code, constraint, message,
 * stack) and avoids dumping query params, which may contain user data.
 */
const describeForLog = (error: unknown) => {
  const pg = getPostgresError(error);
  const base =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { value: String(error) };

  return {
    ...base,
    ...(error instanceof AppError ? { code: error.code, fields: error.fields } : {}),
    ...(pg
      ? { pgCode: pg.code, constraint: pg.constraint, table: pg.table, column: pg.column }
      : {}),
    ...(error instanceof Error && error.cause !== undefined && !(error.cause instanceof AppError)
      ? { cause: describeCause(error.cause) }
      : {}),
  };
};

const describeCause = (cause: unknown) =>
  cause instanceof Error ? { name: cause.name, message: cause.message } : String(cause);

/**
 * Turns any thrown value into a safe `ActionResult` failure.
 *
 * 1. Next.js control-flow errors (`redirect`, `notFound`) are re-thrown untouched.
 * 2. `AppError` keeps its code/fields. If it wraps an infrastructure `cause`, it is logged.
 * 3. Anything else is logged server-side and collapsed into `INTERNAL_ERROR`.
 *
 * Raw Drizzle/PostgreSQL messages never reach the client.
 */
export function handleActionError(error: unknown, context?: ErrorContext): ActionResult<never> {
  unstable_rethrow(error);

  const operation = context?.operation ?? 'unknown';

  if (error instanceof AppError) {
    if (error.cause !== undefined) {
      console.error(`[action:${operation}] ${error.code}`, describeForLog(error));
    }
    return fail(error.code, error.fields);
  }

  console.error(`[action:${operation}] Unexpected server error`, describeForLog(error));

  return fail('INTERNAL_ERROR');
}
