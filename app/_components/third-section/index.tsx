import React from 'react';
import Container from '@/components/container';
import { useTranslations } from 'next-intl';
import FeaturedBookCard from '@/app/_components/third-section/featured-book-card';

const mockDatum = {
  title: 'Book Cover',
  slug: 'book-cover',
  author: 'Shakib Farzan',
  bookCover: '/Book-Cover-Template.png',
};

const mockData = [mockDatum, mockDatum, mockDatum, mockDatum, mockDatum, mockDatum];

const ThirdSection: React.FC = () => {
  const t = useTranslations('LandingPage');
  return (
    <Container className="flex flex-col gap-6 items-center">
      <h2 className="text-4xl font-semibold">{t('3rdTitle')}</h2>
      <p className="text-foreground/60">{t('3rdDescription')}</p>
      <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-8 mt-8 w-11/12">
        {mockData.map((d, index) => (
          <FeaturedBookCard key={d.slug + index} {...d} />
        ))}
      </div>
    </Container>
  );
};

export default ThirdSection;
