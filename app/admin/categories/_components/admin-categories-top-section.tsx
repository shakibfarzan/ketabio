'use client';

import AdminTopSection from '@/app/admin/_components/admin-top-section';
import { useTranslations } from 'next-intl';

const AdminCategoriesTopSection = () => {
  const t = useTranslations('General');

  return (
    <AdminTopSection
      title={t('categoriesManagement')}
      buttonTitle={t('addCategory')}
      onAddClicked={() => {}}
    />
  );
};

export default AdminCategoriesTopSection;
