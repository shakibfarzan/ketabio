'use client';

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from '@/app/admin/categories/actions';
import Container from '@/components/container';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Category } from '@/db/categories';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useTransition } from 'react';
import AdminCategoriesTopSection from './admin-categories-top-section';

type Props = {
  categories: Category[];
};

const CategoriesManager = ({ categories }: Props) => {
  const t = useTranslations('General');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setName('');
    setError(null);
    setIsOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setError(null);
    setIsOpen(true);
  };

  const submitCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = editingCategory
        ? await updateCategoryAction(editingCategory.id, formData)
        : await createCategoryAction(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      router.refresh();
    });
  };

  const removeCategory = (id: string) => {
    if (!window.confirm(t('deleteCategoryConfirmation'))) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', id);
      await deleteCategoryAction(formData);
      router.refresh();
    });
  };

  return (
    <>
      <AdminCategoriesTopSection onAddClicked={openCreateDialog} />
      <Container>
        {categories.length === 0 ? (
          <p className="text-muted-foreground">{t('noCategories')}</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between gap-4 p-4">
                <span className="font-medium">{category.name}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(category)}>
                    {t('edit')}
                  </Button>
                  <Button
                    disabled={isPending}
                    size="sm"
                    type="button"
                    variant="destructive"
                    onClick={() => removeCategory(category.id)}
                  >
                    {t('delete')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(editingCategory ? 'editCategory' : 'addCategory')}</DialogTitle>
          </DialogHeader>
          <form className="space-y-6" onSubmit={submitCategory}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="category-name">
                {t('categoryName')}
              </label>
              <Input
                id="category-name"
                name="name"
                required
                minLength={2}
                maxLength={100}
                value={name}
                placeholder={t('categoryNamePlaceholder')}
                onChange={(event) => setName(event.target.value)}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
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
    </>
  );
};

export default CategoriesManager;
