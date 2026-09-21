import React from 'react';
import Container from '@/components/container';
import AdminBooksTopSection from '@/app/admin/books/_components/admin-books-top-section';
import BooksManager from '@/app/admin/books/_components/books-manager';

const BooksPage = () => {
  return (
    <>
      <AdminBooksTopSection />
      <Container>
        <BooksManager />
      </Container>
    </>
  );
};

export default BooksPage;
