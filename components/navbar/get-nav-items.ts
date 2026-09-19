import routes from '@/constants/routes';
import { ROLES } from '@/db/schema';
import getOrCreateUser from '@/lib/auth/get-or-create-user';
import compact from '@/utils/compact';
import { getTranslations } from 'next-intl/server';

type NavItem = {
  href: string;
  title: string;
};

const getNavItems = async (): Promise<NavItem[]> => {
  const user = await getOrCreateUser();
  const t = await getTranslations('General');
  const isAdmin = user?.role === ROLES.ADMIN;
  return compact([
    !isAdmin && { href: '/', title: t('home') },
    { href: isAdmin ? routes.ADMIN.BOOKS : '/', title: t('books') },
    { href: isAdmin ? routes.ADMIN.CATEGORIES : '/', title: t('categories') },
    isAdmin && { href: isAdmin ? routes.ADMIN.AUTHORS : '/', title: t('authors') },
    !isAdmin && { href: '/', title: t('about') },
  ]);
};

export default getNavItems;
