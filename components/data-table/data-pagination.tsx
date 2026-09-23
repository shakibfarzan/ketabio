'use client';
import { isRtl } from '@/constants/locales';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '../ui/button';
import { useDataTableUrl } from './use-data-table-url';

type Props = {
  total: number;
};

const DataPagination: React.FC<Props> = ({ total }) => {
  const t = useTranslations('DataTable');
  const rtl = isRtl(useLocale());
  const { params, patchParams } = useDataTableUrl();

  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const from = total === 0 ? 0 : (params.page - 1) * params.pageSize + 1;
  const to = Math.min(params.page * params.pageSize, total);
  const PrevIcon = rtl ? ChevronRightIcon : ChevronLeftIcon;
  const NextIcon = rtl ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <div className="flex items-center justify-between gap-4 py-4 mx-4">
      <p className="text-sm text-muted-foreground">{t('showingOf', { from, to, total })}</p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={params.page <= 1}
          onClick={() => patchParams({ page: params.page - 1 })}
          aria-label={t('previous')}
        >
          <PrevIcon />
          <span className="hidden sm:inline">{t('previous')}</span>
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={page === params.page ? 'default' : 'outline'}
            size="sm"
            className="size-8"
            onClick={() => patchParams({ page })}
            aria-current={page === params.page ? 'page' : undefined}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={params.page >= totalPages}
          onClick={() => patchParams({ page: params.page + 1 })}
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
