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
import { createBookAction } from '@/app/admin/books/actions';
import useErrorMessage from '@/hooks/useErrorMessage';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import routes from '@/constants/routes';
import { useTransition } from 'react';

const FORM_FIELDS: ReadonlySet<string> = new Set([
  'title',
  'description',
  'coverImage',
  'bookFile',
  'language',
  'pageCount',
  'publishedAt',
  'authorId',
  'categoryId',
  'isbn',
]);

const toFormData = (values: BookFormValues) => {
  const formData = new FormData();
  formData.set('title', values.title);
  formData.set('description', values.description);
  formData.set('authorId', values.authorId);
  formData.set('categoryId', values.categoryId);
  formData.set('coverImage', values.coverImage);
  formData.set('bookFile', values.bookFile);
  if (values.language?.[0]) formData.set('language', values.language[0]);
  if (values.isbn) formData.set('isbn', values.isbn);
  if (values.pageCount != null) formData.set('pageCount', String(values.pageCount));
  if (values.publishedAt) formData.set('publishedAt', values.publishedAt.toISOString());
  return formData;
};

const BookForm: React.FC = () => {
  const t = useTranslations('Forms');
  const tGeneral = useTranslations('General');
  const { describe } = useErrorMessage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const methods = useForm<BookFormValues, unknown, BookFormValues>({
    defaultValues: {
      title: '',
      authorId: '',
      description: '',
      categoryId: '',
      language: [],
      isbn: '',
      publishedAt: null,
      pageCount: null,
      bookFile: undefined,
      coverImage: undefined,
    },
    // publishedAt is coerced, so the schema's input type is wider than its output type.
    resolver: zodResolver(bookFormSchema(t)) as unknown as Resolver<
      BookFormValues,
      unknown,
      BookFormValues
    >,
  });

  const { handleSubmit, setError } = methods;

  const submit = (values: BookFormValues) => {
    startTransition(async () => {
      const result = await createBookAction(toFormData(values));

      if (!result.success) {
        // Server only sends stable codes; translate them here (presentation layer).
        const { fields, summary } = describe(result.error);
        let shownOnField = false;

        for (const [field, message] of fields) {
          if (!FORM_FIELDS.has(field)) continue;
          setError(field as keyof BookFormValues, { type: 'server', message });
          shownOnField = true;
        }

        if (!shownOnField) toast.error(summary);
        return;
      }

      toast.success(tGeneral('bookCreated'));
      router.push(routes.ADMIN.BOOKS);
    });
  };

  return (
    <div className="">
      <FormProvider {...methods}>
        <form className="flex flex-col md:flex-row gap-6 w-full" onSubmit={handleSubmit(submit)}>
          <LeftSideForm />
          <RightSideForm isPending={isPending} />
        </form>
      </FormProvider>
    </div>
  );
};

const LeftSideForm: React.FC = () => {
  const { control } = useFormContext();
  const t = useTranslations('BookForm');
  const languages = useLanguages();
  const languagesOptions = useMemo<Option[]>(
    () => languages.map((v) => ({ label: v, value: v })),
    [languages]
  );
  return (
    <Card className="w-full md:w-1/2">
      <CardHeader>
        <CardTitle>{t('bookInformation')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 w-full">
        <FormInput
          name="title"
          label={t('title')}
          control={control}
          placeholder={t('titlePlaceholder')}
          isRequired
        />
        <FormSelect
          name="authorId"
          label={t('author')}
          options={[
            { label: 'Author1', value: '1' },
            { label: 'Author2', value: '2' },
          ]}
          isRequired
          control={control}
          placeholder={t('authorPlaceholder')}
        />
        <FormTextarea
          name="description"
          label={t('description')}
          placeholder={t('descriptionPlaceholder')}
          control={control}
          isRequired
        />
        <div className="flex flex-col md:flex-row gap-4 w-full items-center">
          <FormSelect
            name="categoryId"
            label={t('category')}
            options={[
              { label: 'Fiction', value: '1' },
              { label: 'Romance', value: '2' },
            ]}
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
  );
};

const RightSideForm: React.FC<{ isPending: boolean }> = ({ isPending }) => {
  const t = useTranslations('BookForm');
  const tGeneral = useTranslations('General');
  const router = useRouter();
  const { control } = useFormContext();
  return (
    <div className="w-full md:w-1/2 flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-6 w-full">
          <FormFileUploader
            name="coverImage"
            label={t('coverImage')}
            control={control}
            maxFiles={1}
            isRequired
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
            isRequired
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
