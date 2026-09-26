'use client';

import { createAuthorAction, updateAuthorAction } from '@/app/admin/authors/actions';
import FormFileUploader from '@/components/form/form-file-uploader';
import FormInput from '@/components/form/form-input';
import FormTextarea from '@/components/form/form-textarea';
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
import type { AdminAuthor } from '@/db/authors';
import { translationsByLocale } from '@/lib/localization';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect, useTransition } from 'react';
import { useForm, type Path } from 'react-hook-form';
import {
  authorSchema,
  emptyAuthorTranslations,
  emptyAuthorValues,
  type AuthorFormValues,
} from '../form-schemas';

type Props = {
  author: AdminAuthor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

const toDefaultValues = (author: AdminAuthor | null): AuthorFormValues => {
  if (!author) return emptyAuthorValues();

  const stored = translationsByLocale(author.translations ?? []);
  const translations = emptyAuthorTranslations();
  for (const locale of LOCALES) {
    translations[locale] = {
      name: stored[locale]?.name ?? '',
      bio: stored[locale]?.bio ?? '',
    };
  }
  return { translations, avatar: [] };
};

const AuthorModal = ({ author, open, onOpenChange, onSaved }: Props) => {
  const t = useTranslations('General');
  const tForms = useTranslations('Forms');
  const tLocales = useTranslations('Locales');
  const [isPending, startTransition] = useTransition();
  const { control, handleSubmit, reset, setError } = useForm<AuthorFormValues>({
    defaultValues: emptyAuthorValues(),
    resolver: zodResolver(authorSchema(tForms)),
  });

  useEffect(() => {
    if (open) reset(toDefaultValues(author));
  }, [author, open, reset]);

  const submitAuthor = (values: AuthorFormValues) => {
    const formData = new FormData();
    for (const locale of LOCALES) {
      formData.set(`translations.${locale}.name`, values.translations[locale].name);
      formData.set(`translations.${locale}.bio`, values.translations[locale].bio ?? '');
    }
    if (values.avatar?.[0]) formData.set('avatar', values.avatar[0]);

    startTransition(async () => {
      const result = author
        ? await updateAuthorAction(author.id, formData)
        : await createAuthorAction(formData);

      if (result?.error) {
        setError(`translations.${FALLBACK_LOCALE}.name` as Path<AuthorFormValues>, {
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(author ? 'editAuthor' : 'addAuthor')}</DialogTitle>
        </DialogHeader>
        <form className="space-y-6" onSubmit={handleSubmit(submitAuthor)}>
          {LOCALES.map((locale) => (
            <div className="flex flex-col gap-4" key={locale}>
              <FormInput
                control={control}
                isRequired={locale === FALLBACK_LOCALE}
                label={`${tLocales(locale)} ${t('authorName')}`}
                max={100}
                name={`translations.${locale}.name` as Path<AuthorFormValues>}
                placeholder={t('authorNamePlaceholder')}
                inputClassName={isRtl(locale) ? 'font-fa' : ''}
              />
              <FormTextarea
                control={control}
                label={`${tLocales(locale)} ${t('authorBio')}`}
                name={`translations.${locale}.bio` as Path<AuthorFormValues>}
                placeholder={t('authorBioPlaceholder')}
                dir={isRtl(locale) ? 'rtl' : 'ltr'}
                className={isRtl(locale) ? 'font-fa' : ''}
              />
            </div>
          ))}

          <FormFileUploader
            control={control}
            name="avatar"
            label={t('authorAvatar')}
            maxFiles={1}
            accept={{ 'image/*': ['jpg', 'png'] }}
            maxSizeMB={5}
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

export default AuthorModal;
