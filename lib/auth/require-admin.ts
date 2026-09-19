import { ROLES } from '@/db/schema';
import { ForbiddenError, UnauthorizedError } from '../errors';
import getOrCreateUser from './get-or-create-user';

/**
 * Ensures the current request belongs to a signed-in admin.
 * Throws `UnauthorizedError` / `ForbiddenError` (translated later by the UI via error codes).
 */
export default async function requireAdmin() {
  const user = await getOrCreateUser();
  if (!user) throw new UnauthorizedError();
  if (user.role !== ROLES.ADMIN) throw new ForbiddenError();
  return user;
}
