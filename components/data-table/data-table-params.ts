import type {
  DataTableColumn,
  DataTableParams,
  DataTableSort,
  DataTableSortDirection,
} from './types';

/* ------------------------------------------------------------------ *
 * Pure, framework-agnostic URL <-> params serialization.
 * No TanStack, no React, no hooks — trivially unit-testable (SRP) and
 * shared verbatim between the client hook and the consumer's server side.
 * ------------------------------------------------------------------ */

/** Canonical query keys the table owns. */
export const DataTableUrlKeys = {
  search: 'q',
  sort: 'sort',
  sortDir: 'dir',
  /** Prefix for faceted filters: `filter[<columnId>]=<value>` (repeatable). */
  filter: 'filter',
  page: 'page',
  pageSize: 'pageSize',
} as const;

/** Fallbacks applied when a key is missing from the URL. */
export const DataTableUrlDefaults = {
  page: 1,
  pageSize: 10,
  sortDir: 'asc',
} as const;

export function isDataTableSortDir(
  value: unknown
): value is Exclude<DataTableSortDirection, 'asc'> {
  return value === 'desc';
}

export function toPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Deserializes typed `DataTableParams` from raw query values. `source` accepts
 * either a live `URLSearchParams` (client hook) or the plain record a server
 * action receives — one contract for both sides of the action boundary (LSP).
 */
export function parseDataTableParams(
  source: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>,
  opts: DataTableParamsParseOpts = {}
): DataTableParams {
  const isSp = isURLSearchParams(source);

  const get = (key: string): string | undefined =>
    isSp ? (source.get(key) ?? undefined) : firstValue(source[key]);

  const search = get(DataTableUrlKeys.search)?.trim() || undefined;

  const sortId = get(DataTableUrlKeys.sort);
  const sortDir = get(DataTableUrlKeys.sortDir);
  const sort: DataTableSort | undefined =
    sortId && sortId.trim().length > 0
      ? { id: sortId.trim(), dir: isDataTableSortDir(sortDir) ? 'desc' : 'asc' }
      : undefined;

  const filters: Record<string, string[]> = {};
  const filterPrefix = `${DataTableUrlKeys.filter}[`;

  if (isSp) {
    source.forEach((value, key) => {
      if (key.startsWith(filterPrefix) && key.endsWith(']')) {
        const columnId = key.slice(filterPrefix.length, -1);
        if (columnId) (filters[columnId] ??= []).push(value);
      }
    });
  } else {
    for (const [key, value] of Object.entries(source)) {
      if (!key.startsWith(filterPrefix) || !key.endsWith(']')) continue;
      const columnId = key.slice(filterPrefix.length, -1);
      for (const entry of Array.isArray(value) ? value : [value]) {
        if (columnId && entry) (filters[columnId] ??= []).push(entry);
      }
    }
  }

  return {
    ...(search ? { search } : {}),
    ...(sort ? { sort } : {}),
    ...(Object.keys(filters).length > 0 ? { filters } : {}),
    page: toPositiveInt(get(DataTableUrlKeys.page), 1),
    pageSize: toPositiveInt(
      get(DataTableUrlKeys.pageSize),
      opts.defaultPageSize ?? DataTableUrlDefaults.pageSize
    ),
  };
}

/**
 * Serializes params back into a fresh `URLSearchParams`, merging over `base`
 * (the current query string) so the consumer's unrelated params survive and
 * stale table-owned keys are dropped first. Framework-agnostic (DIP).
 */
export function serializeDataTableParams(
  params: DataTableParams,
  base: URLSearchParams | string = ''
): URLSearchParams {
  const merged = new URLSearchParams(typeof base === 'string' ? base : base);

  for (const key of Array.from(merged.keys())) {
    if (
      key === DataTableUrlKeys.search ||
      key === DataTableUrlKeys.sort ||
      key === DataTableUrlKeys.sortDir ||
      key === DataTableUrlKeys.page ||
      key === DataTableUrlKeys.pageSize ||
      key.startsWith(`${DataTableUrlKeys.filter}[`)
    ) {
      merged.delete(key);
    }
  }

  if (params.search) merged.set(DataTableUrlKeys.search, params.search);

  if (params.sort) {
    merged.set(DataTableUrlKeys.sort, params.sort.id);
    merged.set(DataTableUrlKeys.sortDir, params.sort.dir);
  }

  for (const [columnId, values] of Object.entries(params.filters ?? {})) {
    for (const value of values) {
      merged.append(`${DataTableUrlKeys.filter}[${columnId}]`, value);
    }
  }

  if (params.page > 1) merged.set(DataTableUrlKeys.page, String(params.page));
  if (params.pageSize !== DataTableUrlDefaults.pageSize) {
    merged.set(DataTableUrlKeys.pageSize, String(params.pageSize));
  }

  return merged;
}

/**
 * Applies a partial patch to the current params, resetting the cursor to page 1
 * whenever a scope-changing value (search / sort / filters) changed — those
 * invalidate the current page. Returns a new object; never mutates input.
 */
export function patchDataTableParams(
  current: DataTableParams,
  patch: Partial<DataTableParams>
): DataTableParams {
  const scopeChanged =
    ('search' in patch && patch.search !== current.search) ||
    ('sort' in patch && patch.sort !== current.sort) ||
    ('filters' in patch && !sameFilters(patch.filters, current.filters));

  return {
    ...current,
    ...patch,
    page: scopeChanged ? 1 : (patch.page ?? current.page),
  };
}

function sameFilters(
  a: Record<string, string[]> | undefined,
  b: Record<string, string[]> | undefined
): boolean {
  const keysA = Object.keys(a ?? {});
  const keysB = Object.keys(b ?? {});
  if (keysA.length !== keysB.length) return false;
  return keysA.every(
    (key) =>
      (a?.[key]?.length ?? 0) === (b?.[key]?.length ?? 0) &&
      (a?.[key] ?? []).every((value, index) => b?.[key]?.[index] === value)
  );
}

export interface DataTableParamsParseOpts {
  /** Overrides `DataTableUrlDefaults.pageSize` when the URL omits it. */
  defaultPageSize?: number;
}

function isURLSearchParams(
  source: URLSearchParams | Readonly<Record<string, string | string[] | undefined>>
): source is URLSearchParams {
  return typeof (source as URLSearchParams).get === 'function';
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/* Collapsible column-group meta consumers may populate; left empty for
 * clarity — actual UI titles come from the toolbar's filter config. */
export type DataTableUrlOwnedKeys = (typeof DataTableUrlKeys)[keyof typeof DataTableUrlKeys];
export type { DataTableColumn, DataTableParams, DataTableSort, DataTableSortDirection };
