'use client';

import { deleteAuthorAction } from '@/app/admin/authors/actions';
import { DataTable } from '@/components/data-table/data-table';
import type { DataTableColumn } from '@/components/data-table/types';
import { Button } from '@/components/ui/button';
import type { AdminAuthor } from '@/db/authors';
import { useFormatter, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useTransition } from 'react';

type Props = {
  authors: AdminAuthor[];
  total: number;
  onEdit: (author: AdminAuthor) => void;
};

const AuthorsList = ({ authors, total, onEdit }: Props) => {
  const t = useTranslations('General');
  const format = useFormatter();
  const [isPending, startTransition] = useTransition();

  const removeAuthor = (id: string) => {
    if (!window.confirm(t('deleteAuthorConfirmation'))) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set('id', id);
      await deleteAuthorAction(formData);
    });
  };

  const columns: DataTableColumn<AdminAuthor>[] = [
    {
      id: 'avatar',
      header: t('authorAvatar'),
      disableSorting: true,
      cell: (author) =>
        author.avatarUrl ? (
          <Image
            src={author.avatarUrl}
            alt={author.name}
            width={40}
            height={40}
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <div className="bg-muted flex size-10 items-center justify-center rounded-full text-sm font-medium uppercase">
            {author.name.charAt(0)}
          </div>
        ),
    },
    {
      id: 'name',
      header: t('name'),
      accessor: (author) => author.name,
    },
    {
      id: 'createdAt',
      header: t('createdAt'),
      cell: (author) =>
        author.createdAt
          ? format.dateTime(new Date(author.createdAt), { dateStyle: 'medium' })
          : '',
    },
    {
      id: 'actions',
      header: t('actions'),
      disableSorting: true,
      align: 'end',
      cell: (author) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(author)}>
            {t('edit')}
          </Button>
          <Button
            disabled={isPending}
            size="sm"
            type="button"
            variant="destructive"
            onClick={() => removeAuthor(author.id)}
          >
            {t('delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      ariaLabel={t('authors')}
      className="rounded-lg border"
      columns={columns}
      data={authors}
      total={total}
    />
  );
};

export default AuthorsList;
