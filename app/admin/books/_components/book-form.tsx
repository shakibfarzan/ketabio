'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormInput from '@/components/form/form-input';
import { FieldValues, FormProvider, useForm, useFormContext } from 'react-hook-form';
import FormSelect from '@/components/form/form-select';
import FormTextarea from '@/components/form/form-textarea';
import FormDatePicker from '@/components/form/form-date-picker';
import { useTranslations } from 'next-intl';
import FormFileUploader from '@/components/form/form-file-uploader';
import { Button } from '@/components/ui/button';

const BookForm: React.FC = () => {
  const methods = useForm<FieldValues>({
    defaultValues: {
      title: '',
      author: '',
      description: '',
      category: '',
      language: '',
      isbn: '',
      publishedAt: '',
      pageCount: '',
      bookFile: null,
      coverImage: null,
    },
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
        <div className="flex gap-4 items-center">
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
          />
          <FormSelect
            name="language"
            label={t('language')}
            options={[
              { label: 'Author1', value: '1' },
              { label: 'Author2', value: '2' },
            ]}
            isRequired
            control={control}
            placeholder={t('languagePlaceholder')}
          />
        </div>
        <div className="flex gap-4 items-center">
          <FormInput
            name="isbn"
            label="ISBN"
            control={control}
            placeholder={t('isbnPlaceholder')}
          />
          <FormDatePicker
            name="publishedAt"
            label={t('publishedAt')}
            control={control}
            placeholder={t('publishedAtPlaceholder')}
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
            className="w-1/2"
          />
          <div className="w-1/2" />
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
