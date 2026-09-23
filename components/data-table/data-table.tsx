'use client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import DataFilter from './data-filter';
import DataPagination from './data-pagination';
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
  const { params, patchParams } = useDataTableUrl();
  const sort = params.sort;

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

  const filterColumns = columns.filter((col) => col.filter && col.filter.length > 0);

  return (
    <div className={cn('w-full', className)}>
      <DataFilter filterColumns={filterColumns} />
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
                      className="-ml-2 h-8 font-medium"
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
      <DataPagination total={total} />
    </div>
  );
}
