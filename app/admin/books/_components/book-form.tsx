'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormInput from '@/components/form/form-input';
import { FormProvider, useForm, useFormContext, type Resolver } from 'react-hook-form';
import FormSelect, { Option } from '@/components/form/form-select';
import FormTextarea from '@/components/form/form-textarea';
import FormDatePicker from '@/components/form/form-date-picker';
import { useTranslations } from 'next-intl';
import FormFileUploader from '@/components/form/form-file-uploader';
import { Button } from '@/components/ui/button';
import useLanguages from '@/hooks/useLanguages';
import FormMultiSelect from '@/components/form/form-multi-select';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookFormSchema, type BookFormValues } from '@/lib/validators/book.schema';
import { createBookAction, updateBookAction } from '@/app/admin/books/actions';
import useErrorMessage from '@/hooks/useErrorMessage';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import routes from '@/constants/routes';
import { FALLBACK_LOCALE, isRtl, LOCALES, type Locale } from '@/constants/locales';
import { translationsByLocale } from '@/lib/localization';
import type { Path } from 'react-hook-form';
import { useTransition } from 'react';

/** A book as the edit form needs it: language-independent fields plus every translation. */
export type EditableBook = {
  id: string;
  slug: string;
  coverImage: string | null;
  language: string;
  pageCount: number | null;
  publishedAt: Date | null;
  authorId: string | null;
  isbn: string | null;
  categoryId: string | null;
  translations: { locale: Locale; title: string; description: string | null }[];
};

type Props = {
  authors: Option[];
  categories: Option[];
  /** Present when editing; absent when creating. */
  book?: EditableBook;
};

/** Field names the server can report errors for, including the per-locale translation inputs. */
const FORM_FIELDS: ReadonlySet<string> = new Set([
  ...LOCALES.flatMap((locale) => [
    `translations.${locale}.title`,
    `translations.${locale}.description`,
  ]),
  'coverImage',
  'bookFile',
  'language',
  'pageCount',
  'publishedAt',
  'authorId',
  'categoryId',
  'isbn',
]);

const emptyTranslations = () =>
  Object.fromEntries(
    LOCALES.map((locale) => [locale, { title: '', description: '' }])
  ) as BookFormValues['translations'];

const toDefaultValues = (book?: EditableBook): BookFormValues => {
  const stored = translationsByLocale(book?.translations ?? []);
  const translations = emptyTranslations();
  for (const locale of LOCALES) {
    translations[locale] = {
      title: stored[locale]?.title ?? '',
      description: stored[locale]?.description ?? '',
    };
  }

  return {
    translations,
    authorId: book?.authorId ?? '',
    categoryId: book?.categoryId ?? '',
    language: book?.language ? [book.language] : [],
    isbn: book?.isbn ?? '',
    publishedAt: book?.publishedAt ?? null,
    pageCount: book?.pageCount ?? null,
    bookFile: undefined,
    coverImage: undefined,
  };
};

const toFormData = (values: BookFormValues) => {
  const formData = new FormData();

  for (const locale of LOCALES) {
    const translation = values.translations[locale];
    // Locales the admin left blank are not submitted at all (see `formTranslations` in actions.ts).
    if (translation.title.trim()) {
      formData.set(`translations.${locale}.title`, translation.title);
    }
    if (translation.description.trim()) {
      formData.set(`translations.${locale}.description`, translation.description);
    }
  }

  formData.set('authorId', values.authorId);
  formData.set('categoryId', values.categoryId);
  if (values.coverImage) formData.set('coverImage', values.coverImage);
  if (values.bookFile) formData.set('bookFile', values.bookFile);
  if (values.language?.[0]) formData.set('language', values.language[0]);
  if (values.isbn) formData.set('isbn', values.isbn);
  if (values.pageCount != null) formData.set('pageCount', String(values.pageCount));
  if (values.publishedAt) formData.set('publishedAt', values.publishedAt.toISOString());
  return formData;
};

const BookForm: React.FC<Props> = ({ authors, categories, book }) => {
  const t = useTranslations('Forms');
  const tGeneral = useTranslations('General');
  const { describe } = useErrorMessage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(book);

  const methods = useForm<BookFormValues, unknown, BookFormValues>({
    defaultValues: toDefaultValues(book),
    // publishedAt is coerced, so the schema's input type is wider than its output type.
    resolver: zodResolver(bookFormSchema(t, { isEdit })) as unknown as Resolver<
      BookFormValues,
      unknown,
      BookFormValues
    >,
  });

  const { handleSubmit, setError } = methods;

  const submit = (values: BookFormValues) => {
    startTransition(async () => {
      const result = book
        ? await updateBookAction(book.id, toFormData(values))
        : await createBookAction(toFormData(values));

      if (!result.success) {
        // Server only sends stable codes; translate them here (presentation layer).
        const { fields, summary } = describe(result.error);
        let shownOnField = false;

        for (const [field, message] of fields) {
          if (!FORM_FIELDS.has(field)) continue;
          setError(field as Path<BookFormValues>, { type: 'server', message });
          shownOnField = true;
        }

        if (!shownOnField) toast.error(summary);
        return;
      }

      toast.success(tGeneral(book ? 'bookUpdated' : 'bookCreated'));
      router.push(routes.ADMIN.BOOKS);
    });
  };

  return (
    <div className="">
      <FormProvider {...methods}>
        <form className="flex flex-col md:flex-row gap-6 w-full" onSubmit={handleSubmit(submit)}>
          <LeftSideForm authors={authors} categories={categories} />
          <RightSideForm isPending={isPending} isEdit={isEdit} />
        </form>
      </FormProvider>
    </div>
  );
};

/**
 * One block of inputs per supported locale. Rendered from `LOCALES`, so adding a language to
 * `constants/locales.ts` adds a block here with no further changes.
 */
const TranslationsFields: React.FC = () => {
  const { control } = useFormContext<BookFormValues>();
  const t = useTranslations('BookForm');
  const tLocales = useTranslations('Locales');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('translations')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('translationsHint')}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-8 w-full">
        {LOCALES.map((locale) => {
          const isFallback = locale === FALLBACK_LOCALE;
          const dir = isRtl(locale) ? 'rtl' : 'ltr';
          return (
            <div className="flex flex-col gap-4" key={locale}>
              <h4 className="font-medium">
                {tLocales(locale)}
                {isFallback && <span className="text-muted-foreground"> · {t('required')}</span>}
              </h4>
              <FormInput
                name={`translations.${locale}.title` as Path<BookFormValues>}
                label={t('title')}
                control={control}
                placeholder={t('titlePlaceholder')}
                isRequired={isFallback}
                dir={dir}
              />
              <FormTextarea
                name={`translations.${locale}.description` as Path<BookFormValues>}
                label={t('description')}
                placeholder={t('descriptionPlaceholder')}
                control={control}
                isRequired={isFallback}
                dir={dir}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

const LeftSideForm: React.FC<{ authors: Option[]; categories: Option[] }> = ({
  authors,
  categories,
}) => {
  const { control } = useFormContext<BookFormValues>();
  const t = useTranslations('BookForm');
  const languages = useLanguages();
  const languagesOptions = useMemo<Option[]>(
    () => languages.map((v) => ({ label: v, value: v })),
    [languages]
  );

  return (
    <div className="flex w-full md:w-1/2 flex-col gap-6">
      <TranslationsFields />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('bookInformation')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 w-full">
          <FormSelect
            name="authorId"
            label={t('author')}
            options={authors}
            isRequired
            control={control}
            placeholder={t('authorPlaceholder')}
          />
          <div className="flex flex-col md:flex-row gap-4 w-full items-center">
            <FormSelect
              name="categoryId"
              label={t('category')}
              options={categories}
              isRequired
              control={control}
              placeholder={t('categoryPlaceholder')}
              className="md:w-1/2 w-full"
            />
            <FormMultiSelect
              name="language"
              label={t('language')}
              options={languagesOptions}
              control={control}
              placeholder={t('languagePlaceholder')}
              className="w-full"
              isMultiSelect={false}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full items-center">
            <FormInput
              name="isbn"
              label="ISBN"
              control={control}
              placeholder={t('isbnPlaceholder')}
              className="md:w-1/2 w-full"
            />
            <FormDatePicker
              name="publishedAt"
              label={t('publishedAt')}
              control={control}
              placeholder={t('publishedAtPlaceholder')}
              className="md:w-1/2 w-full"
            />
          </div>
          <div className="flex gap-4 items-center">
            <FormInput
              name="pageCount"
              label={t('pageCount')}
              control={control}
              placeholder={t('pageCountPlaceholder')}
              min={1}
              type="number"
              className="md:w-1/2 w-full"
            />
            <div className="w-1/2 hidden md:block" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const RightSideForm: React.FC<{ isPending: boolean; isEdit: boolean }> = ({
  isPending,
  isEdit,
}) => {
  const t = useTranslations('BookForm');
  const tGeneral = useTranslations('General');
  const router = useRouter();
  const { control } = useFormContext<BookFormValues>();
  return (
    <div className="w-full md:w-1/2 flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-6 w-full">
          <FormFileUploader
            name="coverImage"
            label={t('coverImage')}
            control={control}
            maxFiles={1}
            isRequired={!isEdit}
            accept={{ 'image/*': ['jpg', 'png'] }}
            maxSizeMB={5}
            labelClassName="text-base"
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-6 w-full">
          <FormFileUploader
            name="bookFile"
            label={t('bookFile')}
            control={control}
            maxFiles={1}
            isRequired={!isEdit}
            accept={{ 'application/pdf': [] }}
            maxSizeMB={100}
            labelClassName="text-base"
          />
        </CardContent>
      </Card>
      <div className="flex w-full items-center justify-end gap-1">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => router.push(routes.ADMIN.BOOKS)}
        >
          {tGeneral('cancel')}
        </Button>
        <Button type="submit" disabled={isPending}>
          {tGeneral('save')}
        </Button>
      </div>
    </div>
  );
};

export default BookForm;
