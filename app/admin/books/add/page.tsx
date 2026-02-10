import React from 'react';
import TopSection from '@/components/top-section';
import { useTranslations } from 'next-intl';

const AddBookPage = () => {
  const t = useTranslations('General');
  return (
    <>
      <TopSection title={t('addBook')} />
    </>
  );
};

export default AddBookPage;
