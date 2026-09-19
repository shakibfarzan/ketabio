# Error handling

```
Drizzle / PostgreSQL  →  db/*.ts (repository)  →  AppError(code)  →  Server Action  →  ActionResult<T>  →  UI: t(code)
```

- **`lib/errors/error-codes.ts`** – the only source of codes (`ERROR_CODES`, `FIELD_ERROR_CODES`). Every code needs an entry in `messages/en.json` and `messages/fa.json` under `errors` (checked by `tests/errors/translations.test.ts`).
- **`lib/errors/app-error.ts`** – `AppError` + thin `NotFoundError` / `ConflictError` / `UnauthorizedError` / `ForbiddenError` / `ValidationError`. The message is the code; the raw cause stays in `error.cause` for logs.
- **`lib/errors/database-error.ts`** – `isUniqueViolation(error, constraint?)`, `isForeignKeyViolation`, … Walks `DrizzleQueryError.cause` to the `NeonDbError` (SQLSTATE `code`, `constraint`).
- **`lib/errors/error-handler.ts`** – `handleActionError(error, { operation })`: `AppError` → its code/fields; anything else → logged + `INTERNAL_ERROR`.
- **`lib/errors/validation.ts`** – `getValidationErrors(zodError)` → `{ field: CODE }` (server schemas use codes as Zod messages).
- **`types/action-result.ts`** – `ActionResult<T>`, `ok()`, `fail()`.
- **`hooks/useErrorMessage.ts`** – client side: `translate(code)` / `describe(actionError)`; unknown strings fall back to `INTERNAL_ERROR` so arbitrary data never becomes a translation key.

Rules: repositories never import next-intl or return text; Server Actions never leak `error.message`; the UI is the only place that translates.

Adding an entity: add codes → add both translations → repository maps constraints with `database-error` helpers → action wraps with `try { … } catch (e) { return handleActionError(e, { operation }) }`.

Tests: `npm test` (Node test runner + PGlite in-memory PostgreSQL for real constraint violations).
