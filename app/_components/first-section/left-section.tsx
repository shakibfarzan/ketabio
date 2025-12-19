import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const LeftSection: React.FC = () => {
  const t = useTranslations('LandingPage');
  return (
    <div className="lg:w-1/3 w-full flex flex-col gap-8">
      <h1 className="text-6xl font-semibold">{t('title')}</h1>
      <h5 className="text-xl text-foreground/70">{t('description')}</h5>
      <div className="flex items-center gap-4">
        <Button size="lg">
          {t('browseBooks')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button size="lg" variant="outline">
          {t('joinNow')}
        </Button>
      </div>
    </div>
  );
};

export default LeftSection;
