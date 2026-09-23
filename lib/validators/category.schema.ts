import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/*  Server-side schemas for the admin category list. Messages are stable codes. */
/* -------------------------------------------------------------------------- */

export const categoryListOptionsSchema = z.object({
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sort: z.enum(['name', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
