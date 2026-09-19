import { auth, currentUser } from '@clerk/nextjs/server';

export default async function getCurrentClerkUser() {
  const { userId } = await auth();

  if (!userId) return null;

  const clerkUser = await currentUser();

  if (!clerkUser) return null;

  return clerkUser;
}
