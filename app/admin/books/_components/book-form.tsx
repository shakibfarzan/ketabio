'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormInput from '@/components/form/form-input';
import { FieldValues, FormProvider, useForm, useFormContext } from 'react-hook-form';
import FormSelect, { Option } from '@/components/form/form-select';
import FormTextarea from '@/components/form/form-textarea';
import FormDatePicker from '@/components/form/form-date-picker';
import { useTranslations } from 'next-intl';
import FormFileUploader from '@/components/form/form-file-uploader';
import { Button } from '@/components/ui/button';
import useLanguages from '@/hooks/useLanguages';
import FormMultiSelect from '@/components/form/form-multi-select';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookFormSchema } from '@/lib/validators/book.schema';

const BookForm: React.FC = () => {
  const t = useTranslations('Forms');
  const methods = useForm({
    defaultValues: {
      title: '',
      author: '',
      description: '',
      category: '',
      language: [],
      isbn: '',
      publishedAt: null,
      pageCount: null,
      bookFile: undefined,
      coverImage: undefined,
    },
    resolver: zodResolver(bookFormSchema(t)),
  });

  const { handleSubmit } = methods;
  return (
    <div className="">
      <FormProvider {...methods}>
        <form
          className="flex flex-col md:flex-row gap-6 w-full"
          onSubmit={handleSubmit((values) => {
            console.log('Values', values);
          })}
        >
          <LeftSideForm />
          <RightSideForm />
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
          name="author"
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
            name="category"
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

const RightSideForm: React.FC = () => {
  const t = useTranslations('BookForm');
  const tGeneral = useTranslations('General');
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
        <Button variant="secondary">{tGeneral('cancel')}</Button>
        <Button type="submit">{tGeneral('save')}</Button>
      </div>
    </div>
  );
};

export default BookForm;
