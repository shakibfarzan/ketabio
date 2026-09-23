'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { isRtl } from '@/constants/locales';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/utils';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import * as React from 'react';
import type { DataTableColumn } from './types';
import { useDataTableUrl } from './use-data-table-url';

export interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  total: number;
  ariaLabel?: string;
  className?: string;
}

export function DataTable<TData>({
  columns,
  data,
  total,
  ariaLabel,
  className,
}: DataTableProps<TData>) {
  const t = useTranslations('DataTable');
  const rtl = isRtl(useLocale());
  const { params, patchParams } = useDataTableUrl();
  const sort = params.sort;
  const [draft, setDraft] = React.useState(params.search ?? '');
  const debounced = useDebouncedValue(draft, 300);
  const lastSearch = React.useRef<string | undefined>(params.search);

  React.useEffect(() => {
    if (params.search !== lastSearch.current) {
      lastSearch.current = params.search;
      setDraft(params.search ?? '');
      return;
    }
    if (debounced === (params.search ?? '')) return;
    lastSearch.current = debounced || undefined;
    patchParams({ search: debounced || undefined });
  }, [debounced, params.search, patchParams]);

  const toggleSort = (col: DataTableColumn<TData>) => {
    const dir =
      sort?.id !== col.id
        ? col.sortDescFirst
          ? 'desc'
          : 'asc'
        : sort.dir === 'asc'
          ? 'desc'
          : undefined;
    patchParams({ sort: dir ? { id: col.id, dir } : undefined });
  };

  const toggleFilter = (colId: string, value: string) => {
    const filters = { ...(params.filters ?? {}) };
    const selected = filters[colId] ?? [];
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    if (next.length > 0) filters[colId] = next;
    else delete filters[colId];
    patchParams({ filters: Object.keys(filters).length > 0 ? filters : undefined });
  };

  const filterColumns = columns.filter((col) => col.filter && col.filter.length > 0);
  const filterCount = Object.values(params.filters ?? {}).reduce(
    (sum, list) => sum + list.length,
    0
  );
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const from = total === 0 ? 0 : (params.page - 1) * params.pageSize + 1;
  const to = Math.min(params.page * params.pageSize, total);
  const PrevIcon = rtl ? ChevronRightIcon : ChevronLeftIcon;
  const NextIcon = rtl ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-wrap items-center gap-2 py-4">
        <div className="relative min-w-40 flex-1">
          <SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className="ps-9"
          />
        </div>
        {filterColumns.map((col) => {
          const selected = params.filters?.[col.id] ?? [];
          return (
            <Popover key={col.id}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <PlusIcon />
                  {col.filterTitle ?? col.header}
                  {selected.length > 0 && (
                    <Badge variant="secondary" className="ms-1">
                      {selected.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-0">
                <Command>
                  <CommandInput placeholder={col.header} />
                  <CommandList>
                    <CommandEmpty>{t('noResults')}</CommandEmpty>
                    <CommandGroup>
                      {col.filter?.map((opt) => (
                        <CommandItem
                          key={opt.value}
                          value={opt.value}
                          data-checked={selected.includes(opt.value) ? 'true' : undefined}
                          onSelect={() => toggleFilter(col.id, opt.value)}
                        >
                          {opt.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          );
        })}
        {filterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => patchParams({ filters: undefined })}>
            <XIcon />
            {t('clearFilters')}
          </Button>
        )}
      </div>
      <Table aria-label={ariaLabel}>
        <TableHeader>
          <TableRow>
            {columns.map((col) => {
              const active = sort?.id === col.id;
              const action =
                active && sort.dir === 'asc' ? t('sortDescending') : t('sortAscending');
              return (
                <TableHead
                  key={col.id}
                  className={cn(col.align === 'end' && 'text-end', col.className)}
                >
                  {col.disableSorting ? (
                    <span className="inline-flex items-center gap-2 font-medium">{col.header}</span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-me-2 h-8 font-medium"
                      onClick={() => toggleSort(col)}
                      aria-label={`${action} ${col.header}`}
                    >
                      {col.header}
                      {active ? (
                        sort.dir === 'asc' ? (
                          <ArrowUpIcon className="size-4" />
                        ) : (
                          <ArrowDownIcon className="size-4" />
                        )
                      ) : (
                        <ChevronsUpDownIcon className="size-4 opacity-50" />
                      )}
                    </Button>
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {t('noData')}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    className={cn(col.align === 'end' && 'text-end', col.className)}
                  >
                    {col.cell?.(row) ?? String(col.accessor?.(row) ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between gap-4 py-4">
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
    </div>
  );
}
