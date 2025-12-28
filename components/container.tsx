import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
};

const Container: React.FC<Props> = ({ className, children }) => {
  return <section className={cn('px-12 py-16', className)}>{children}</section>;
};

export default Container;
