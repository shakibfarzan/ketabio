import React from 'react';
import TopSection from '@/components/top-section';
import { useTranslations } from 'next-intl';
import BookForm from '@/app/admin/books/_components/book-form';
import Container from '@/components/container';

const AddBookPage = () => {
  const t = useTranslations('General');
  return (
    <>
      <TopSection title={t('addBook')} />
      <Container className="-mt-12">
        <BookForm />
      </Container>
    </>
  );
};

export default AddBookPage;
