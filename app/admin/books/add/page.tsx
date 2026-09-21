import React from 'react';
import TopSection from '@/components/top-section';
import { getTranslations } from 'next-intl/server';
import BookForm from '@/app/admin/books/_components/book-form';
import Container from '@/components/container';
import { listAuthors } from '@/db/authors';
import { listCategories } from '@/db/categories';
import { getRequestLocale } from '@/lib/request-locale';

const AddBookPage = async () => {
  const t = await getTranslations('General');

  // Author/category options are loaded for the admin's locale, so the selects show translated names.
  const locale = await getRequestLocale();
  const [authors, categories] = await Promise.all([listAuthors(locale), listCategories(locale)]);

  return (
    <>
      <TopSection title={t('addBook')} />
      <Container className="-mt-16">
        <BookForm
          authors={authors.map(({ id, name }) => ({ label: name, value: id }))}
          categories={categories.map(({ id, name }) => ({ label: name, value: id }))}
        />
      </Container>
    </>
  );
};

export default AddBookPage;
