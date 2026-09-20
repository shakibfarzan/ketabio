import React from 'react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Container from '@/components/container';
import TopSection from '@/components/top-section';
import BookForm from '@/app/admin/books/_components/book-form';
import { listAuthors } from '@/db/authors';
import { listCategories } from '@/db/categories';
import { getBookBySlug, getBookTranslations } from '@/db/books';
import { isAppError } from '@/lib/errors';
import { getRequestLocale } from '@/lib/request-locale';

const EditBookPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const t = await getTranslations('General');
  const { slug } = await params;
  const locale = await getRequestLocale();

  let book;
  try {
    book = await getBookBySlug(slug, locale);
  } catch (error) {
    if (isAppError(error) && error.code === 'BOOK_NOT_FOUND') notFound();
    throw error;
  }

  // The edit form shows every locale at once, so it needs the raw translation rows.
  const [translations, authors, categories] = await Promise.all([
    getBookTranslations(book.id),
    listAuthors(locale),
    listCategories(locale),
  ]);

  return (
    <>
      <TopSection title={t('editBook')} />
      <Container className="-mt-16">
        <BookForm
          authors={authors.map(({ id, name }) => ({ label: name, value: id }))}
          categories={categories.map(({ id, name }) => ({ label: name, value: id }))}
          book={{
            id: book.id,
            slug: book.slug,
            coverImage: book.coverImage,
            language: book.language,
            pageCount: book.pageCount,
            publishedAt: book.publishedAt,
            authorId: book.authorId,
            isbn: book.isbn,
            categoryId: book.categories[0]?.id ?? null,
            translations: translations.map(({ locale: rowLocale, title, description }) => ({
              locale: rowLocale,
              title,
              description,
            })),
          }}
        />
      </Container>
    </>
  );
};

export default EditBookPage;
