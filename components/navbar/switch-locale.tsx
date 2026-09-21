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
import { LOCALE_COOKIE, LOCALES, type Locale } from '@/constants/locales';
import { useLocale } from 'use-intl';

/** Flag asset per supported locale. Adding a locale to `LOCALES` requires an entry here. */
const LOCALE_FLAGS: Record<Locale, string> = {
  en: '/gb.svg',
  fa: '/ir.svg',
};

const SwitchLocale: React.FC = () => {
  const t = useTranslations('General');
  const tLocales = useTranslations('Locales');
  const locale = useLocale();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = (lang: Locale) => {
    setCookie(LOCALE_COOKIE, lang);
    window.location.reload();
  };

  const trigger = (
    <Button variant="ghost" size="icon">
      {LOCALES.map((lang) => (
        <Image
          key={lang}
          className={locale !== lang ? 'hidden' : 'rounded'}
          src={LOCALE_FLAGS[lang]}
          alt={tLocales(lang)}
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
        {LOCALES.map((lang) => (
          <DropdownMenuItem key={lang} onClick={() => handleClick(lang)}>
            {tLocales(lang)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SwitchLocale;
