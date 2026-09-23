'use client';

import { deleteCategoryAction } from '@/app/admin/categories/actions';
import { DataTable } from '@/components/data-table/data-table';
import type { DataTableColumn } from '@/components/data-table/types';
import { Button } from '@/components/ui/button';
import type { AdminCategory } from '@/db/categories';
import { useFormatter, useTranslations } from 'next-intl';
import { useTransition } from 'react';

type Props = {
  categories: AdminCategory[];
  total: number;
  onEdit: (category: AdminCategory) => void;
};

const CategoriesList = ({ categories, total, onEdit }: Props) => {
  const t = useTranslations('General');
  const format = useFormatter();
  const [isPending, startTransition] = useTransition();

  const removeCategory = (id: string) => {
    if (!window.confirm(t('deleteCategoryConfirmation'))) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', id);
      await deleteCategoryAction(formData);
    });
  };

  const columns: DataTableColumn<AdminCategory>[] = [
    {
      id: 'name',
      header: t('name'),
      accessor: (category) => category.name,
    },
    {
      id: 'createdAt',
      header: t('createdAt'),
      sortDescFirst: true,
      cell: (category) =>
        category.createdAt
          ? format.dateTime(new Date(category.createdAt), { dateStyle: 'medium' })
          : '',
    },
    {
      id: 'actions',
      header: t('actions'),
      disableSorting: true,
      align: 'end',
      cell: (category) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(category)}>
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
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel={t('categories')}
      className="rounded-lg border"
      columns={columns}
      data={categories}
      total={total}
    />
  );
};

export default CategoriesList;
