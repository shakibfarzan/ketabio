'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TopSection from '@/components/top-section';
import { useTranslations } from 'next-intl';
import { useLocale } from 'use-intl';
import { useRouter } from 'next/navigation';
import routes from '@/constants/routes';

const AdminBooksTopSection: React.FC = () => {
  const t = useTranslations('General');
  const { push } = useRouter();
  const locale = useLocale();
  const isPersian = locale === 'fa';
  return (
    <TopSection
      title={t('booksManagement')}
      rightComponent={
        <Button
          onClick={() => push(routes.ADMIN.ADD_BOOK)}
          className={isPersian ? 'flex-row-reverse' : ''}
        >
          <Plus />
          {t('addBook')}
        </Button>
      }
    />
  );
};

export default AdminBooksTopSection;
