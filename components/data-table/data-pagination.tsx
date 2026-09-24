'use client';
import { isRtl } from '@/constants/locales';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { TransitionStartFunction, useOptimistic } from 'react';
import { Button } from '../ui/button';
import { useDataTableUrl } from './use-data-table-url';

type Props = {
  total: number;
  startTransition: TransitionStartFunction;
  isPending: boolean;
};

const DataPagination: React.FC<Props> = ({ total, startTransition, isPending }) => {
  const t = useTranslations('DataTable');
  const rtl = isRtl(useLocale());
  const { params, patchParams } = useDataTableUrl();
  const [optimisticPage, setOptimisticPage] = useOptimistic(params.page);

  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const from = total === 0 ? 0 : (params.page - 1) * params.pageSize + 1;
  const to = Math.min(params.page * params.pageSize, total);
  const PrevIcon = rtl ? ChevronRightIcon : ChevronLeftIcon;
  const NextIcon = rtl ? ChevronLeftIcon : ChevronRightIcon;

  const goToPage = (page: number) => {
    startTransition(() => {
      setOptimisticPage(page);
      patchParams({ page });
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 py-4 mx-4">
      <p className="text-sm text-muted-foreground">{t('showingOf', { from, to, total })}</p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={params.page <= 1 || isPending}
          onClick={() => goToPage(params.page - 1)}
          aria-label={t('previous')}
        >
          <PrevIcon />
          <span className="hidden sm:inline">{t('previous')}</span>
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            disabled={isPending}
            key={page}
            variant={page === optimisticPage ? 'default' : 'outline'}
            size="sm"
            className="size-8"
            onClick={() => goToPage(page)}
            aria-current={page === optimisticPage ? 'page' : undefined}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={params.page >= totalPages || isPending}
          onClick={() => goToPage(params.page + 1)}
          aria-label={t('next')}
        >
          <span className="hidden sm:inline">{t('next')}</span>
          <NextIcon />
        </Button>
      </div>
    </div>
  );
};

export default DataPagination;
