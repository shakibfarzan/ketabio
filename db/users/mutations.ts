import { eq } from 'drizzle-orm';
import { db } from '..';
import { users } from '../schema';
import { User } from './types';

type SyncUserData = {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
};

export const createUser = async (userId: string, data: SyncUserData) => {
  const [created] = await db
    .insert(users)
    .values({
      id: userId,
      email: data.email ?? '',
      role: 'member',
      firstName: data.firstName,
      lastName: data.lastName,
      avatarUrl: data.avatarUrl,
    } as User)
    .returning();

  return created;
};

export const updateUser = async (userId: string, data: SyncUserData) => {
  const [updated] = await db.update(users).set(data).where(eq(users.id, userId)).returning();

  return updated;
};
