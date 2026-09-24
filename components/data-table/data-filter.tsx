'use client';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { TransitionStartFunction } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { DataTableColumn } from './types';
import { useDataTableUrl } from './use-data-table-url';

type Props<TData> = {
  filterColumns: DataTableColumn<TData>[];
  startTransition: TransitionStartFunction;
  isPending: boolean;
};

export default function DataFilter<TData>({
  filterColumns,
  isPending,
  startTransition,
}: Props<TData>) {
  const t = useTranslations('DataTable');
  const { params, patchParams } = useDataTableUrl();
  const [draft, setDraft] = React.useState(params.search ?? '');
  const debounced = useDebouncedValue(draft, 300);

  React.useEffect(() => {
    if (debounced === (params.search ?? '')) return;

    startTransition(() => {
      patchParams({ search: debounced || undefined });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, patchParams]);

  const filterCount = Object.values(params.filters ?? {}).reduce(
    (sum, list) => sum + list.length,
    0
  );

  const toggleFilter = (colId: string, value: string) => {
    startTransition(() => {
      const filters = { ...(params.filters ?? {}) };
      const selected = filters[colId] ?? [];
      const next = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      if (next.length > 0) filters[colId] = next;
      else delete filters[colId];
      patchParams({ filters: Object.keys(filters).length > 0 ? filters : undefined });
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      <div className="relative min-w-40 flex-1 mx-4">
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
  );
}
