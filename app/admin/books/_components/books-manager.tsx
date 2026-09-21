'use client';

import { deleteBookAction, listBooksAction } from '@/app/admin/books/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import routes from '@/constants/routes';
import type { BookPage, LocalizedBook } from '@/db/books/types';
import useErrorMessage from '@/hooks/useErrorMessage';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

/**
 * Admin book list.
 *
 * The server action resolves the caller's locale and returns already-localized books, so this
 * component only renders `book.title` / `book.author.name` / `book.categories[].name` and never
 * has to look inside a translation table.
 */
const BooksManager: React.FC = () => {
  const t = useTranslations('General');
  const { translate } = useErrorMessage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<BookPage | null>(null);

  const load = useCallback(
    async (searchTerm: string, requestedPage: number) => {
      const response = await listBooksAction({
        search: searchTerm || undefined,
        page: requestedPage,
        pageSize: PAGE_SIZE,
      });

      if (!response.success) {
        toast.error(translate(response.error.code));
        return;
      }
      setResult(response.data);
    },
    [translate]
  );

  useEffect(() => {
    startTransition(() => {
      void load(search, page);
    });
  }, [load, page, search]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(term.trim());
  };

  const remove = (book: LocalizedBook) => {
    if (!window.confirm(t('deleteBookConfirmation'))) return;

    startTransition(async () => {
      const response = await deleteBookAction(book.id);
      if (!response.success) {
        toast.error(translate(response.error.code));
        return;
      }
      toast.success(t('bookDeleted'));
      await load(search, page);
      router.refresh();
    });
  };

  const books = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <form className="flex w-full gap-2" onSubmit={submitSearch}>
        <Input
          onChange={(event) => setTerm(event.target.value)}
          placeholder={t('searchBooksPlaceholder')}
          type="search"
          value={term}
        />
        <Button disabled={isPending} type="submit" variant="outline">
          {t('search')}
        </Button>
      </form>

      {books.length === 0 ? (
        <p className="text-muted-foreground">{t('noBooks')}</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {books.map((book) => (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4" key={book.id}>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{book.title}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {t('byAuthor', { author: book.author?.name ?? t('unknown') })}
                  {book.categories.length > 0 &&
                    ` · ${book.categories.map((category) => category.name).join(', ')}`}
                </span>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={routes.ADMIN.EDIT_BOOK(book.slug)}>{t('edit')}</Link>
                </Button>
                <Button
                  disabled={isPending}
                  onClick={() => remove(book)}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  {t('delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t('pageInfo', { page: result?.page ?? 1, totalPages })}
        </span>
        <div className="flex gap-2">
          <Button
            disabled={isPending || page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            size="sm"
            type="button"
            variant="outline"
          >
            {t('previous')}
          </Button>
          <Button
            disabled={isPending || page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            size="sm"
            type="button"
            variant="outline"
          >
            {t('next')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BooksManager;
