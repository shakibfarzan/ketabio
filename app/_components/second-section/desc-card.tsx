import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const DescCard: React.FC<Props> = ({ title, description, icon }) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default DescCard;
