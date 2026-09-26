import { FALLBACK_LOCALE, localeChain, type Locale } from '@/constants/locales';
import { AppError, NotFoundError } from '@/lib/errors';
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  sql,
  type SQLWrapper,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '..';
import { authorTranslations, authors } from '../schema';
import { escapeLikePattern, localizedColumn, resolvedLocaleColumn } from '../translation-sql';
import type {
  AdminAuthor,
  Author,
  AuthorListOptions,
  AuthorPage,
  AuthorSortField,
  AuthorTranslation,
  LocalizedAuthor,
} from './types';

const authorTranslation = alias(authorTranslations, 'author_translation');
const authorTranslationFallback = alias(authorTranslations, 'author_translation_fallback');

/** The author name in the requested locale, or in the fallback locale. */
const authorName = () =>
  localizedColumn<string | null>(authorTranslation.name, authorTranslationFallback.name);

/** The author biography in the requested locale, or in the fallback locale. */
const authorBio = () =>
  localizedColumn<string | null>(authorTranslation.bio, authorTranslationFallback.bio);

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const SORT_FIELDS: Record<AuthorSortField, SQLWrapper> = {
  name: sql`coalesce(${authorTranslation.name}, ${authorTranslationFallback.name})`,
  createdAt: authors.createdAt,
};

const normalizePaging = (options: AuthorListOptions = {}) => {
  const pageSize = Math.min(
    Math.max(Math.trunc(options.pageSize ?? DEFAULT_PAGE_SIZE), 1),
    MAX_PAGE_SIZE
  );
  const page = Math.max(Math.trunc(options.page ?? 1), 1);
  return { page, pageSize };
};

/**
 * Case-insensitive match against the translated name of the requested locale and of the fallback
 * locale, so a search always covers what the user can see.
 */
const matchesSearch = (term: string, locale: Locale) =>
  exists(
    db
      .select({ found: sql`1` })
      .from(authorTranslations)
      .where(
        and(
          eq(authorTranslations.authorId, authors.id),
          inArray(authorTranslations.locale, localeChain(locale)),
          ilike(authorTranslations.name, escapeLikePattern(term))
        )
      )
  );

const selectAuthors = (locale: Locale, id?: string, options: AuthorListOptions = {}) => {
  const { page, pageSize } = normalizePaging(options);
  const term = options.search?.trim();
  const sort = SORT_FIELDS[options.sort ?? 'name'] ?? SORT_FIELDS.name;
  const direction = options.order === 'desc' ? desc : asc;
  const query = db
    .select({
      id: authors.id,
      slug: authors.slug,
      avatarUrl: authors.avatarUrl,
      createdAt: authors.createdAt,
      name: authorName(),
      bio: authorBio(),
      locale: resolvedLocaleColumn(authorTranslation.id, authorTranslationFallback.id, locale),
    })
    .from(authors)
    .leftJoin(
      authorTranslation,
      and(eq(authorTranslation.authorId, authors.id), eq(authorTranslation.locale, locale))
    )
    .leftJoin(
      authorTranslationFallback,
      and(
        eq(authorTranslationFallback.authorId, authors.id),
        eq(authorTranslationFallback.locale, FALLBACK_LOCALE)
      )
    )
    .where(and(id ? eq(authors.id, id) : undefined, term ? matchesSearch(term, locale) : undefined))
    // Default: alphabetical by the localized name.
    .orderBy(direction(sort), asc(authors.slug));

  // Pagination is only applied when explicitly requested (public/read paths stay unbounded).
  return options.page !== undefined || options.pageSize !== undefined
    ? query.limit(pageSize).offset((page - 1) * pageSize)
    : query;
};

const toLocalizedAuthor = (row: Awaited<ReturnType<typeof selectAuthors>>[number]) =>
  ({ ...row, name: row.name ?? '', bio: row.bio ?? null }) satisfies LocalizedAuthor;

/**
 * All authors with their name in `locale` (falling back to English).
 * Cached per locale — `locale` is part of the cache key.
 */
export const listAuthors = async (locale: Locale): Promise<LocalizedAuthor[]> => {
  'use cache';
  cacheLife('days');
  cacheTag('authors');
  try {
    return (await selectAuthors(locale)).map(toLocalizedAuthor);
  } catch (error) {
    throw new AppError('AUTHOR_FETCH_FAILED', { cause: error });
  }
};

export const getAuthorById = async (id: string, locale: Locale): Promise<LocalizedAuthor> => {
  let rows: Awaited<ReturnType<typeof selectAuthors>>;
  try {
    rows = await selectAuthors(locale, id);
  } catch (error) {
    throw new AppError('AUTHOR_FETCH_FAILED', { cause: error });
  }
  const author = rows[0];
  if (!author) throw new NotFoundError('AUTHOR_NOT_FOUND');
  return toLocalizedAuthor(author);
};

/** Full, unresolved translation list — used by the edit form. */
export const getAuthorTranslations = async (authorId: string): Promise<AuthorTranslation[]> => {
  try {
    return await db
      .select()
      .from(authorTranslations)
      .where(eq(authorTranslations.authorId, authorId))
      .orderBy(asc(authorTranslations.locale));
  } catch (error) {
    throw new AppError('AUTHOR_FETCH_FAILED', { cause: error });
  }
};

/** Language-independent row, for the write path (no locale needed to check existence). */
export const getAuthorRow = async (id: string): Promise<Author> => {
  let author: Author | undefined;
  try {
    author = await db.query.authors.findFirst({ where: eq(authors.id, id) });
  } catch (error) {
    throw new AppError('AUTHOR_FETCH_FAILED', { cause: error });
  }
  if (!author) throw new NotFoundError('AUTHOR_NOT_FOUND');
  return author;
};

const countAuthors = async (locale: Locale, search?: string): Promise<number> => {
  const term = search?.trim();
  const [row] = await db
    .select({ value: count() })
    .from(authors)
    .where(term ? matchesSearch(term, locale) : undefined);
  return row?.value ?? 0;
};

/** Second stage of the admin list: attach every translation of the page's authors. */
const attachTranslations = async (rows: LocalizedAuthor[]): Promise<AdminAuthor[]> => {
  const grouped = new Map<string, AuthorTranslation[]>();
  const ids = rows.map((row) => row.id);

  if (ids.length > 0) {
    const translations = await db
      .select()
      .from(authorTranslations)
      .where(inArray(authorTranslations.authorId, ids))
      .orderBy(asc(authorTranslations.locale));

    for (const translation of translations) {
      const list = grouped.get(translation.authorId) ?? [];
      list.push(translation);
      grouped.set(translation.authorId, list);
    }
  }

  return rows.map((author) => ({
    ...author,
    translations: grouped.get(author.id) ?? [],
  }));
};

/**
 * Paginated, filterable, sortable admin author list. Every page item carries the full, unresolved
 * translation list so the admin can edit in place.
 */
export const listAuthorsForAdmin = async (
  locale: Locale,
  options: AuthorListOptions = {}
): Promise<AuthorPage> => {
  'use cache';
  cacheLife('days');
  cacheTag('authors');
  const { page, pageSize } = normalizePaging(options);
  try {
    const [rows, total] = await Promise.all([
      selectAuthors(locale, undefined, { ...options, page, pageSize }),
      countAuthors(locale, options.search),
    ]);
    return {
      items: await attachTranslations(rows.map(toLocalizedAuthor)),
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    };
  } catch (error) {
    throw new AppError('AUTHOR_FETCH_FAILED', { cause: error });
  }
};
