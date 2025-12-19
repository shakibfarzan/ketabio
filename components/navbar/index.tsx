import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import NavItem from '@/components/navbar/nav-item';
import ModeToggle from '@/components/navbar/mode-toggle';

const Navbar: React.FC = () => {
  const t = useTranslations('General');
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Image src="/ketabio.png" alt="Ketabio" width={180} height={100} />

        <nav className="hidden md:flex items-center gap-6">
          <NavItem href="/" title={t('books')} />
          <NavItem href="/" title={t('categories')} />
          <NavItem href="/" title={t('about')} />
        </nav>

        <div className="flex items-center gap-3">
          <ModeToggle />
          <Button variant="ghost" asChild>
            <Link href="/">{t('login')}</Link>
          </Button>
          <Button asChild>
            <Link href="/">{t('signUp')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
