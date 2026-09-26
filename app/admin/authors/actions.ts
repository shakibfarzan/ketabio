'use server';

import { LOCALES, type Locale } from '@/constants/locales';
import { parseDataTableParams } from '@/components/data-table/data-table-params';
import { createAuthor, deleteAuthor, listAuthorsForAdmin, updateAuthor } from '@/db/authors';
import type { AuthorListOptions, AuthorPage, AuthorTranslationsInput } from '@/db/authors/types';
import requireAdmin from '@/lib/auth/require-admin';
import { AppError } from '@/lib/errors';
import { getRequestLocale } from '@/lib/request-locale';
import { authorListOptionsSchema } from '@/lib/validators/author.schema';
import safeAction from '@/utils/safe-action';
import { uploadFile } from '@/utils/config-files';
import { getTranslations } from 'next-intl/server';
import { updateTag } from 'next/cache';
import { z } from 'zod';
import { authorSchema } from './form-schemas';

/**
 * `translations.en.name`, `translations.fa.bio`, … → `{ en: { name, bio }, fa: { name, bio } }`.
 */
const parseAuthor = async (formData: FormData) => {
  const tForms = await getTranslations('Forms');
  const translations = Object.fromEntries(
    LOCALES.map((locale) => {
      const name = formData.get(`translations.${locale}.name`);
      const bio = formData.get(`translations.${locale}.bio`);
      return [
        locale,
        {
          name: typeof name === 'string' ? name : '',
          bio: typeof bio === 'string' ? bio : '',
        },
      ];
    })
  ) as Record<Locale, { name: string; bio?: string }>;

  return authorSchema(tForms).safeParse({ translations });
};

/** Only locales with a name become translation rows; empty bios are stored as `null`. */
const toTranslationsInput = (
  translations: Record<Locale, { name: string; bio?: string }>
): AuthorTranslationsInput => {
  const input: AuthorTranslationsInput = {};
  for (const locale of LOCALES) {
    const value = translations[locale];
    if (!value?.name) continue;
    input[locale] = { name: value.name, bio: value.bio?.trim() ? value.bio : null };
  }
  return input;
};

/** An uploaded avatar file, or `undefined` when the admin left the field untouched. */
const avatarFile = (formData: FormData) => {
  const value = formData.get('avatar');
  return value instanceof File && value.size > 0 ? value : undefined;
};

export const createAuthorAction = async (formData: FormData) => {
  const parsed = await parseAuthor(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return safeAction(async () => {
    const file = avatarFile(formData);
    const avatarUrl = file ? await uploadFile(file) : null;
    await createAuthor(toTranslationsInput(parsed.data.translations), avatarUrl);
    updateTag('authors');
  });
};

export const updateAuthorAction = async (id: string, formData: FormData) => {
  const parsed = await parseAuthor(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return safeAction(async () => {
    const file = avatarFile(formData);
    // Only replace the stored avatar when a new file was picked.
    const avatarUrl = file ? await uploadFile(file) : undefined;
    await updateAuthor(id, toTranslationsInput(parsed.data.translations), avatarUrl);
    updateTag('authors');
  });
};

export const deleteAuthorAction = async (formData: FormData) => {
  const id = formData.get('id');
  if (typeof id !== 'string' || !z.uuid().safeParse(id).success) return;
  return safeAction(async () => {
    await deleteAuthor(id);
    updateTag('authors');
  });
};

/**
 * Paginated admin author list. Every option is serialized by the DataTable into the URL
 * (`q`, `sort`, `dir`, `page`, `pageSize`), parsed back here through `parseDataTableParams`,
 * then mapped to the domain options. Validates everything (stable `VALIDATION_ERROR` code on bad
 * input), enforces an admin session, and returns already-localized authors plus their full
 * translations for in-place editing.
 */
export const listAuthorsAction = async (
  input: Readonly<Record<string, string | string[] | undefined>> = {}
) =>
  safeAction(async (): Promise<AuthorPage> => {
    const tableParams = parseDataTableParams(input);
    const options: AuthorListOptions = {
      ...(tableParams.search ? { search: tableParams.search } : {}),
      ...(tableParams.sort
        ? {
            sort: tableParams.sort.id === 'createdAt' ? 'createdAt' : 'name',
            order: tableParams.sort.dir,
          }
        : {}),
      page: tableParams.page,
      pageSize: tableParams.pageSize,
    };
    const parsedInput = authorListOptionsSchema.safeParse(options);
    if (!parsedInput.success) throw new AppError('VALIDATION_ERROR');
    await requireAdmin();
    const locale = await getRequestLocale();

    return listAuthorsForAdmin(locale, parsedInput.data);
  });
