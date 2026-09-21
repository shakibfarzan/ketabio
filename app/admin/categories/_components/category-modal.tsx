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
import { FALLBACK_LOCALE, isRtl, LOCALES } from '@/constants/locales';
import type { AdminCategory } from '@/db/categories';
import { translationsByLocale } from '@/lib/localization';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useTransition } from 'react';
import { useForm, type Path } from 'react-hook-form';
import {
  categorySchema,
  emptyCategoryTranslations,
  type CategoryFormValues,
} from '../form-schemas';

type Props = {
  category: AdminCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

const toDefaultValues = (category: AdminCategory | null): CategoryFormValues => {
  const stored = translationsByLocale(category?.translations ?? []);
  const translations = emptyCategoryTranslations();
  for (const locale of LOCALES) {
    translations[locale] = { name: stored[locale]?.name ?? '' };
  }
  return { translations };
};

const CategoryModal = ({ category, open, onOpenChange, onSaved }: Props) => {
  const t = useTranslations('General');
  const tForms = useTranslations('Forms');
  const tLocales = useTranslations('Locales');
  const [isPending, startTransition] = useTransition();
  const { control, handleSubmit, reset, setError } = useForm<CategoryFormValues>({
    defaultValues: toDefaultValues(null),
    resolver: zodResolver(categorySchema(tForms)),
  });

  useEffect(() => {
    if (open) reset(toDefaultValues(category));
  }, [category, open, reset]);

  const submitCategory = (values: CategoryFormValues) => {
    const formData = new FormData();
    for (const locale of LOCALES) {
      formData.set(`translations.${locale}.name`, values.translations[locale].name);
    }

    startTransition(async () => {
      const result = category
        ? await updateCategoryAction(category.id, formData)
        : await createCategoryAction(formData);

      if (result?.error) {
        setError(`translations.${FALLBACK_LOCALE}.name` as Path<CategoryFormValues>, {
          message: result.error,
        });
        return;
      }

      onOpenChange(false);
      onSaved?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(category ? 'editCategory' : 'addCategory')}</DialogTitle>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleSubmit(submitCategory)}>
          {LOCALES.map((locale) => (
            <div className="flex flex-col gap-2" key={locale}>
              <span className="text-sm font-medium">{tLocales(locale)}</span>
              <FormInput
                control={control}
                isRequired={locale === FALLBACK_LOCALE}
                label={t('categoryName')}
                max={100}
                name={`translations.${locale}.name` as Path<CategoryFormValues>}
                placeholder={t('categoryNamePlaceholder')}
              />
            </div>
          ))}
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
