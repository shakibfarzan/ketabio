import ModeToggle from '@/components/navbar/mode-toggle';
import NavItem from '@/components/navbar/nav-item';
import SwitchLocale from '@/components/navbar/switch-locale';
import { Button } from '@/components/ui/button';
import routes from '@/constants/routes';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { shadcn } from '@clerk/themes';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import getNavItems from './get-nav-items';

const Navbar: React.FC = async () => {
  const t = await getTranslations('General');
  const navItems = await getNavItems();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Image
          className="dark:hidden mt-1"
          src="/ketabio.png"
          alt="Ketabio"
          width={180}
          height={20}
        />
        <Image
          className="hidden dark:block mt-1"
          src="/ketabio-light.png"
          alt="Ketabio"
          width={180}
          height={20}
        />

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map(({ href, title }) => (
            <NavItem key={title} href={href} title={title} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <SwitchLocale />
          <ModeToggle />
          <SignedIn>
            <UserButton appearance={{ theme: shadcn }} />
          </SignedIn>
          <SignedOut>
            <Button variant="ghost" asChild>
              <Link href={routes.AUTH.LOGIN}>{t('login')}</Link>
            </Button>
            <Button asChild>
              <Link href={routes.AUTH.SIGN_UP}>{t('signUp')}</Link>
            </Button>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
