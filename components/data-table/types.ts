import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ *
 * Contracts shared by the table and its consumers. Consumers declare
 * columns + hand the already-fetched rows/total; the table never imports
 * from consumers and never fetches — it serialises its state into the URL
 * and reads the next page back from props (DIP: the server action is the
 * only data source, and it lives with the consumer).
 * ------------------------------------------------------------------ */

/** A single check-list entry inside a faceted filter. */
export interface DataTableFacetedOption {
  label: string;
  value: string;
}

/** A column the consumer declares. Sorting/filtering are URL-mounted by the table. */
export interface DataTableColumn<TData> {
  /** Column id — must match `sort` / `filter[<id>]` the server reads. */
  id: string;
  /** Header label shown in the (sortable) header control. */
  header: string;
  /** Reads the value used for the default cell + faceted lookup. */
  accessor?: (row: TData) => unknown;
  /** Custom cell renderer; falls back to `String(accessor(row) ?? '')`. */
  cell?: (row: TData) => ReactNode;
  /** Disable sorting on this column. */
  disableSorting?: boolean;
  /** Start descending when this column is sorted the first time. */
  sortDescFirst?: boolean;
  /** Faceted filter options — a column with `filter` renders a filter in the toolbar. */
  filter?: DataTableFacetedOption[];
  /** Title of the faceted filter (defaults to the column header). */
  filterTitle?: string;
  /** Column started hidden; still toggleable from the column menu. */
  defaultHidden?: boolean;
  /** Horizontal alignment for the header and cells. */
  align?: 'start' | 'end';
  /** Extra classes on the column's `<th>`/`<td>` pair. */
  className?: string;
}

/**
 * The URL view of the table — the single source of truth. Consumers serialize
 * these back into the URL (see `data-table-params`), their server reads them,
 * and the next page simply shows up in `rows`. The table itself never keeps a
 * copy: no dual state to drift.
 */
export interface DataTableParams {
  /** Global search term (`q`). */
  search?: string;
  /** Active sort (`sort` + `dir`). */
  sort?: DataTableSort;
  /** Faceted selections keyed by column id (`filter[<id>]`, repeated values). */
  filters?: Record<string, string[]>;
  /** 1-based page index (`page`). */
  page: number;
  /** Rows per page (`pageSize`). */
  pageSize: number;
  /** Every scalar above serialises 1:1 to a documented query key. */
}

export type DataTableSortDirection = 'asc' | 'desc';

export interface DataTableSort {
  id: string;
  dir: DataTableSortDirection;
}
