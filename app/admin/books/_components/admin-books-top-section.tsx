'use client';
import routes from '@/constants/routes';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import React from 'react';
import AdminTopSection from '../../_components/admin-top-section';

const AdminBooksTopSection: React.FC = () => {
  const t = useTranslations('General');
  const { push } = useRouter();
  return (
    <AdminTopSection
      buttonTitle={t('addBook')}
      onAddClicked={() => push(routes.ADMIN.ADD_BOOK)}
      title={t('booksManagement')}
    />
  );
};

export default AdminBooksTopSection;
