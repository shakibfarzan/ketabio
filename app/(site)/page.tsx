import FirstSection from '@/app/_components/first-section';
import SecondSection from '@/app/_components/second-section';
import ThirdSection from '@/app/_components/third-section';
import ForthSection from '@/app/_components/forth-section';
import FifthSection from '@/app/_components/fifth-section';
import { getOrCreateUser } from '@/utils/auth';
import { ROLES } from '@/db/schema';
import { redirect } from 'next/navigation';
import routes from '@/constants/routes';

export default async function Page() {
  const user = await getOrCreateUser();
  const isAdmin = user?.role === ROLES.ADMIN;

  if (isAdmin) redirect(routes.ADMIN);

  return (
    <>
      <FirstSection />
      <SecondSection />
      <ThirdSection />
      <ForthSection />
      <FifthSection />
    </>
  );
}
