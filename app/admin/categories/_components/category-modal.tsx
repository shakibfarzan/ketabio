'use client';

import { createCategoryAction, updateCategoryAction } from '@/app/admin/categories/actions';
import FormInput from '@/components/form/form-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Category } from '@/db/categories';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { categorySchema } from '../form-schemas';

type CategoryFormValues = {
  name: string;
};

type Props = {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

const CategoryModal = ({ category, open, onOpenChange, onSaved }: Props) => {
  const t = useTranslations('General');
  const tForms = useTranslations('Forms');
  const [isPending, startTransition] = useTransition();
  const { control, handleSubmit, reset, setError } = useForm({
    defaultValues: { name: '' },
    resolver: zodResolver(categorySchema(tForms)),
  });

  useEffect(() => {
    if (open) reset({ name: category?.name ?? '' });
  }, [category, open, reset]);

  const submitCategory = (values: CategoryFormValues) => {
    const formData = new FormData();
    formData.set('name', values.name);

    startTransition(async () => {
      const result = category
        ? await updateCategoryAction(category.id, formData)
        : await createCategoryAction(formData);

      if (result?.error) {
        setError('name', { message: result.error });
        return;
      }

      onOpenChange(false);
      onSaved();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(category ? 'editCategory' : 'addCategory')}</DialogTitle>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleSubmit(submitCategory)}>
          <FormInput
            label={t('categoryName')}
            name="name"
            control={control}
            isRequired
            max={100}
            placeholder={t('categoryNamePlaceholder')}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={isPending} type="button" variant="secondary">
                {t('cancel')}
              </Button>
            </DialogClose>
            <Button disabled={isPending} type="submit">
              {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;
