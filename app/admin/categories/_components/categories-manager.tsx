'use client';

import { deleteCategoryAction } from '@/app/admin/categories/actions';
import Container from '@/components/container';
import { Button } from '@/components/ui/button';
import type { AdminCategory } from '@/db/categories';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import AdminCategoriesTopSection from './admin-categories-top-section';
import CategoryModal from './category-modal';

type Props = {
  categories: AdminCategory[];
};

const CategoriesManager = ({ categories }: Props) => {
  const t = useTranslations('General');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setIsOpen(true);
  };

  const openEditDialog = (category: AdminCategory) => {
    setEditingCategory(category);
    setIsOpen(true);
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
                {/* Already localized for the current locale by `listCategoriesForAdmin`. */}
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

      <CategoryModal
        category={editingCategory}
        open={isOpen}
        onOpenChange={setIsOpen}
        onSaved={() => router.refresh()}
      />
    </>
  );
};

export default CategoriesManager;
