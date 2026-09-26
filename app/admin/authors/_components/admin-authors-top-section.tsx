'use client';

import AdminTopSection from '@/app/admin/_components/admin-top-section';
import { useTranslations } from 'next-intl';

type Props = {
  onAddClicked: () => void;
};

const AdminAuthorsTopSection = ({ onAddClicked }: Props) => {
  const t = useTranslations('General');

  return (
    <AdminTopSection
      title={t('authorsManagement')}
      buttonTitle={t('addAuthor')}
      onAddClicked={onAddClicked}
    />
  );
};

export default AdminAuthorsTopSection;
