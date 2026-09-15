'use client';

import AdminTopSection from '@/app/admin/_components/admin-top-section';
import { useTranslations } from 'next-intl';

const AdminAuthorsTopSection = () => {
  const t = useTranslations('General');

  return (
    <AdminTopSection
      title={t('authorsManagement')}
      buttonTitle={t('addAuthor')}
      onAddClicked={() => {}}
    />
  );
};

export default AdminAuthorsTopSection;
