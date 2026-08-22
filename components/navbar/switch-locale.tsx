'use client';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { setCookie } from '@/utils/client-cookies';
import { useLocale } from 'use-intl';

type Lang = {
  lang: string;
  title: string;
  flagSrc: string;
};

const langs: Lang[] = [
  { lang: 'en', title: 'English', flagSrc: '/gb.svg' },
  { lang: 'fa', title: 'Persian', flagSrc: '/ir.svg' },
];

const SwitchLocale: React.FC = () => {
  const t = useTranslations('General');
  const locale = useLocale();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (lang: string) => {
    setCookie('locale', lang);
    window.location.reload();
  };

  const trigger = (
    <Button variant="ghost" size="icon">
      {langs.map(({ lang, flagSrc }) => (
        <Image
          key={lang}
          className={locale !== lang ? 'hidden' : 'rounded'}
          src={flagSrc}
          alt={lang}
          width={25}
          height={25}
        />
      ))}
      <span className="sr-only">{t('switchLanguage')}</span>
    </Button>
  );

  if (!mounted) {
    return trigger;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {langs.map(({ title, lang }) => (
          <DropdownMenuItem key={lang} onClick={() => handleClick(lang)}>
            {t(title)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SwitchLocale;
