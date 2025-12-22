import React from 'react';
import Container from '@/components/container';
import { useTranslations } from 'next-intl';
import DescCard from '@/app/_components/second-section/desc-card';
import { BookOpen, RefreshCw, Search, Star } from 'lucide-react';

const SecondSection: React.FC = () => {
  const t = useTranslations('LandingPage');
  return (
    <Container className="flex flex-col gap-6 items-center bg-muted">
      <h2 className="text-4xl font-semibold">{t('questionText')}</h2>
      <p className="text-foreground/60">{t('2ndDescription')}</p>
      <div className="grid grid-cols-1 lg:grid-cols-4 sm:grid-cols-2 mx-8 gap-8 mt-8">
        <DescCard icon={<BookOpen />} title={t('1stCardTitle')} description={t('1stCardDesc')} />
        <DescCard icon={<Search />} title={t('2ndCardTitle')} description={t('2ndCardDesc')} />
        <DescCard icon={<RefreshCw />} title={t('3rdCardTitle')} description={t('3rdCardDesc')} />
        <DescCard icon={<Star />} title={t('4thCardTitle')} description={t('4thCardDesc')} />
      </div>
    </Container>
  );
};

export default SecondSection;
