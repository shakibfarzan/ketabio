'use client';

import Container from '@/components/container';
import type { AdminCategory, CategoryPage } from '@/db/categories';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import AdminCategoriesTopSection from './admin-categories-top-section';
import CategoriesList from './categories-list';
import CategoryModal from './category-modal';

type Props = {
  categories: CategoryPage | undefined;
};

const CategoriesManager = ({ categories }: Props) => {
  const t = useTranslations('General');
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

  return (
    <>
      <AdminCategoriesTopSection onAddClicked={openCreateDialog} />
      <Container>
        {categories && categories.total > 0 ? (
          <CategoriesList
            categories={categories.items}
            total={categories.total}
            onEdit={openEditDialog}
          />
        ) : (
          <p className="text-muted-foreground">{t('noCategories')}</p>
        )}
      </Container>

      <CategoryModal category={editingCategory} open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default CategoriesManager;
