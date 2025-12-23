import React from 'react';
import { useTranslations } from 'next-intl';
import Container from '@/components/container';
import { Button } from '@/components/ui/button';

const FifthSection: React.FC = () => {
  const t = useTranslations('LandingPage');
  return (
    <Container className="flex flex-col gap-6 items-center bg-black/90 dark:bg-white/90">
      <h2 className="text-4xl font-semibold text-background">{t('5thTitle')}</h2>
      <p className="text-background/80">{t('5thDescription')}</p>
      <Button variant="secondary" size="lg" className="px-6 dark:text-foreground">
        {t('createYourFreeAccount')}
      </Button>
    </Container>
  );
};

export default FifthSection;
