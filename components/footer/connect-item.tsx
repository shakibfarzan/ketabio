import React from 'react';
import Link from 'next/link';

type Props = {
  title: string;
  icon: React.ReactNode;
  href: string;
};

const ConnectItem: React.FC<Props> = ({ icon, href, title }) => {
  return (
    <Link href={href} className="text-muted-foreground hover:text-foreground transition-colors">
      <span className="sr-only">{title}</span>
      {icon}
    </Link>
  );
};

export default ConnectItem;
