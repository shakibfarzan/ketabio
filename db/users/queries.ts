import { eq } from 'drizzle-orm';
import { db } from '..';
import { users } from '../schema';

export const getUserById = async (userId: string) => {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
  });
};
