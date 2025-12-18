import React from 'react';
import { useTranslations } from 'next-intl';

const LeftSection: React.FC = () => {
  const t = useTranslations('LandingPage');
  return (
    <div>
      <h1>{t('title')}</h1>
    </div>
  );
};

export default LeftSection;
