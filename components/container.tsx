import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
};

const Container: React.FC<Props> = ({ className, children }) => {
  return <div className={cn('p-12', className)}>{children}</div>;
};

export default Container;
