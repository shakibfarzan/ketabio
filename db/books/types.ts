import { books } from '../schema';

export type Book = typeof books.$inferSelect;
export type BookInsert = typeof books.$inferInsert;
