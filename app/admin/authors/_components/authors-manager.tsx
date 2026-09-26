'use client';

import Container from '@/components/container';
import type { AdminAuthor, AuthorPage } from '@/db/authors';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import AdminAuthorsTopSection from './admin-authors-top-section';
import AuthorsList from './authors-list';
import AuthorModal from './author-modal';

type Props = {
  authors: AuthorPage | undefined;
};

const AuthorsManager = ({ authors }: Props) => {
  const t = useTranslations('General');
  const [isOpen, setIsOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<AdminAuthor | null>(null);

  const openCreateDialog = () => {
    setEditingAuthor(null);
    setIsOpen(true);
  };

  const openEditDialog = (author: AdminAuthor) => {
    setEditingAuthor(author);
    setIsOpen(true);
  };

  return (
    <>
      <AdminAuthorsTopSection onAddClicked={openCreateDialog} />
      <Container className="py-10">
        {authors && authors.total > 0 ? (
          <AuthorsList authors={authors.items} total={authors.total} onEdit={openEditDialog} />
        ) : (
          <p className="text-muted-foreground">{t('noAuthors')}</p>
        )}
      </Container>

      <AuthorModal author={editingAuthor} open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default AuthorsManager;
