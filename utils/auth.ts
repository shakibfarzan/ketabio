import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { ROLES, users } from '@/db/schema';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors/app-error';
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

/**
 * Ensures the current request belongs to a signed-in admin.
 * Throws `UnauthorizedError` / `ForbiddenError` (translated later by the UI via error codes).
 */
export const requireAdmin = async () => {
  const user = await getOrCreateUser();
  if (!user) throw new UnauthorizedError();
  if (user.role !== ROLES.ADMIN) throw new ForbiddenError();
  return user;
};
