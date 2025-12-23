import React from 'react';
import Container from '@/components/container';
import { useTranslations } from 'next-intl';
import LevelSection from '@/app/_components/forth-section/level-section';

const ForthSection: React.FC = () => {
  const t = useTranslations('LandingPage');
  return (
    <Container className="flex flex-col gap-6 items-center bg-muted">
      <h2 className="text-4xl font-semibold">{t('4thTitle')}</h2>
      <p className="text-foreground/60">{t('4thDescription')}</p>
      <div className="w-full grid grid-cols-1 md:grid-cols-3 mt-6 gap-8">
        <LevelSection level={1} title={t('1stLvlTitle')} description={t('1stLvlDesc')} />
        <LevelSection level={2} title={t('2ndLvlTitle')} description={t('2ndLvlDesc')} />
        <LevelSection level={3} title={t('3rdLvlTitle')} description={t('3rdLvlDesc')} />
      </div>
    </Container>
  );
};

export default ForthSection;
