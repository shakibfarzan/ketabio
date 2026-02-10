import React from 'react';
import { useTranslations } from 'next-intl';
import Container from '@/components/container';
import AdminBooksTopSection from '@/app/admin/books/_components/admin-books-top-section';

const BooksPage = () => {
  const t = useTranslations('General');
  return (
    <>
      <AdminBooksTopSection />
      <Container>Hello</Container>
    </>
  );
};

export default BooksPage;
