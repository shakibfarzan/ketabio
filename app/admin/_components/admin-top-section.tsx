'use client';

import TopSection from '@/components/top-section';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useLocale } from 'next-intl';

type Props = {
  title: string;
  onAddClicked: () => void;
  buttonTitle: string;
};

const AdminTopSection: React.FC<Props> = ({ buttonTitle, onAddClicked, title }) => {
  const locale = useLocale();
  const isPersian = locale === 'fa';
  return (
    <TopSection
      title={title}
      rightComponent={
        <Button onClick={onAddClicked} className={isPersian ? 'flex-row-reverse' : ''}>
          <Plus />
          {buttonTitle}
        </Button>
      }
    />
  );
};

export default AdminTopSection;
