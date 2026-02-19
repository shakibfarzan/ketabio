'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FormInput from '@/components/form/form-input';
import { FieldValues, useForm } from 'react-hook-form';
import FormSelect from '@/components/form/form-select';
import FormTextarea from '@/components/form/form-textarea';
import FormDatePicker from '@/components/form/form-date-picker';

const BookForm: React.FC = () => {
  const { control, handleSubmit } = useForm<FieldValues>({
    defaultValues: {
      title: '',
      author: '',
      description: '',
      category: '',
      language: '',
      isbn: '',
      publishedAt: '',
      pageCount: '',
    },
  });
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full">
      <Card className="w-full md:w-1/2">
        <CardHeader>
          <CardTitle>Book Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit(() => {})}>
            <FormInput
              name="title"
              label={'Title'}
              control={control}
              placeholder={'Enter book title'}
              isRequired
            />
            <FormSelect
              name="author"
              label={'Author'}
              options={[
                { label: 'Author1', value: '1' },
                { label: 'Author2', value: '2' },
              ]}
              isRequired
              control={control}
              placeholder={'Select author name'}
            />
            <FormTextarea
              name="description"
              label={'Description'}
              placeholder={'Enter book description'}
              control={control}
              isRequired
            />
            <div className="flex gap-4 items-center">
              <FormSelect
                name="category"
                label={'Category'}
                options={[
                  { label: 'Fiction', value: '1' },
                  { label: 'Romance', value: '2' },
                ]}
                isRequired
                control={control}
                placeholder={'Select category'}
              />
              <FormSelect
                name="language"
                label={'Language'}
                options={[
                  { label: 'Author1', value: '1' },
                  { label: 'Author2', value: '2' },
                ]}
                isRequired
                control={control}
                placeholder={'Select language'}
              />
            </div>
            <div className="flex gap-4 items-center">
              <FormInput name="isbn" label={'ISBN'} control={control} placeholder={'Enter ISBN'} />
              <FormDatePicker
                name="publishedAt"
                label={'Publication Date'}
                control={control}
                placeholder={'Enter publication date'}
              />
            </div>
            <div className="flex gap-4 items-center">
              <FormInput
                name="pageCount"
                label={'Page Count'}
                control={control}
                placeholder={'Enter page count'}
                min={1}
                type="number"
                className="w-1/2"
              />
              <div className="w-1/2" />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookForm;
