'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import {
  parseDataTableParams,
  patchDataTableParams,
  serializeDataTableParams,
} from './data-table-params';
import type { DataTableParams } from './types';

export interface DataTableUrlReturn {
  params: DataTableParams;
  patchParams: (patch: Partial<DataTableParams>) => void;
}

/**
 * Reads the table's params straight from the URL and returns a `patchParams`
 * writer that merges + re-serializes onto the current query string, keeping the
 * consumer's unrelated params and resetting the cursor when the scope changed
 * (search / sort / filters → page 1). The URL stays the single source of truth
 * — the table never holds a second copy (DIP / SRP).
 */
export function useDataTableUrl(): DataTableUrlReturn {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo(() => parseDataTableParams(searchParams), [searchParams]);

  const patchParams = (patch: Partial<DataTableParams>) => {
    const next = patchDataTableParams(params, patch);
    const nextParams = serializeDataTableParams(next, searchParams);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  };

  return { params, patchParams };
}
