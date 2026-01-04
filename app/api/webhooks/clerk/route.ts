import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { User as ClerkUser } from '@clerk/backend';
import { User } from '@/db/users';

type EventType = {
  type: string;
  data: ClerkUser;
};

export async function POST(req: Request) {
  const payload = await req.text();
  const headerList = await headers();

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  const evt = wh.verify(payload, Object.fromEntries(headerList)) as EventType;

  if (evt.type === 'user.created') {
    const user = evt.data;

    await db.insert(users).values({
      id: user.id,
      email: user.emailAddresses[0].emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      role: 'member',
    } as User);
  }

  if (evt.type === 'user.deleted') {
    await db.delete(users).where(eq(users.id, evt.data.id));
  }

  return new Response('OK');
}
