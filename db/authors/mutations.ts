import { AppError } from '@/lib/errors';
import type { BatchItem } from 'drizzle-orm/batch';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '..';
import { authors, books } from '../schema';
import { mapAuthorWriteError, primaryName, translationUpserts, uniqueSlug } from './helpers';
import { getAuthorRow } from './queries';
import type { Author, AuthorTranslationsInput } from './types';

/**
 * Author writes.
 *
 * An author and its translations are written in one `batch()` — the atomic primitive of the
 * `neon-http` driver — so an author can never exist without a translatable name.
 */

export const createAuthor = async (
  translations: AuthorTranslationsInput,
  avatarUrl?: string | null
): Promise<Author> => {
  try {
    const slug = await uniqueSlug(primaryName(translations));
    const id = randomUUID();

    const statements: [BatchItem<'pg'>, ...BatchItem<'pg'>[]] = [
      db
        .insert(authors)
        .values({ id, slug, avatarUrl: avatarUrl ?? null })
        .returning(),
    ];
    statements.push(...translationUpserts(id, translations));

    const [created] = await db.batch(statements);
    return (created as Author[])[0];
  } catch (error) {
    throw mapAuthorWriteError(error) ?? new AppError('AUTHOR_CREATE_FAILED', { cause: error });
  }
};

export const updateAuthor = async (
  id: string,
  translations: AuthorTranslationsInput,
  avatarUrl?: string | null
): Promise<Author> => {
  await getAuthorRow(id); // -> AUTHOR_NOT_FOUND

  try {
    const slug = await uniqueSlug(primaryName(translations), id);

    const statements: [BatchItem<'pg'>, ...BatchItem<'pg'>[]] = [
      db
        .update(authors)
        // A new avatar is only written when one was uploaded; otherwise the stored one is kept.
        .set({ slug, ...(avatarUrl !== undefined ? { avatarUrl } : {}) })
        .where(eq(authors.id, id))
        .returning(),
    ];
    statements.push(...translationUpserts(id, translations));

    const [updated] = await db.batch(statements);
    return (updated as Author[])[0];
  } catch (error) {
    throw mapAuthorWriteError(error) ?? new AppError('AUTHOR_UPDATE_FAILED', { cause: error });
  }
};

export const deleteAuthor = async (id: string): Promise<Author> => {
  await getAuthorRow(id); // -> AUTHOR_NOT_FOUND

  try {
    // Books keep existing but lose their author reference; author_translations is removed by
    // ON DELETE CASCADE.
    const [, deletedAuthors] = await db.batch([
      db.update(books).set({ authorId: null }).where(eq(books.authorId, id)),
      db.delete(authors).where(eq(authors.id, id)).returning(),
    ]);
    return deletedAuthors[0];
  } catch (error) {
    throw new AppError('AUTHOR_DELETE_FAILED', { cause: error });
  }
};
