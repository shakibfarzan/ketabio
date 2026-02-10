import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { User } from '@/db/users';

export const getOrCreateUser = async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const syncedData = {
    email: clerkUser.emailAddresses[0]?.emailAddress ?? user?.email,
    firstName: clerkUser.firstName as string,
    lastName: clerkUser.lastName as string,
    avatarUrl: clerkUser.imageUrl,
  };

  if (user) {
    const [updated] = await db
      .update(users)
      .set(syncedData)
      .where(eq(users.id, userId))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0].emailAddress,
      role: 'member',
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
    } as User)
    .returning();

  return created;
};
