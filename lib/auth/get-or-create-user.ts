import { createUser, updateUser } from '@/db/users/mutations';
import { getUserById } from '@/db/users/queries';
import getCurrentClerkUser from './current-user';

export default async function getOrCreateUser() {
  const clerkUser = await getCurrentClerkUser();

  if (!clerkUser) return null;

  const existingUser = await getUserById(clerkUser.id);

  const syncedData = {
    email: clerkUser.emailAddresses[0]?.emailAddress ?? existingUser?.id,
    firstName: clerkUser.firstName as string,
    lastName: clerkUser.lastName as string,
    avatarUrl: clerkUser.imageUrl,
  };

  // User doesn't exist in our DB
  if (!existingUser) {
    return createUser(clerkUser.id, syncedData);
  }

  // Only update DB if Clerk data actually changed
  const hasChanges =
    existingUser.email !== syncedData.email ||
    existingUser.firstName !== syncedData.firstName ||
    existingUser.lastName !== syncedData.lastName ||
    existingUser.avatarUrl !== syncedData.avatarUrl;

  if (!hasChanges) {
    return existingUser;
  }

  return updateUser(clerkUser.id, syncedData);
}
