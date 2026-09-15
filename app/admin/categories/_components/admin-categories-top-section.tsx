'use client';

import AdminTopSection from '@/app/admin/_components/admin-top-section';
import { useTranslations } from 'next-intl';

type Props = {
  onAddClicked: () => void;
};

const AdminCategoriesTopSection = ({ onAddClicked }: Props) => {
  const t = useTranslations('General');

  return (
    <AdminTopSection
      title={t('categoriesManagement')}
      buttonTitle={t('addCategory')}
      onAddClicked={onAddClicked}
    />
  );
};

export default AdminCategoriesTopSection;
