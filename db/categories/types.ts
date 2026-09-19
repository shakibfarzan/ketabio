import { categories } from '../schema';

export type Category = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;
