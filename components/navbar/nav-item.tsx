import React from 'react';
import Link from 'next/link';

type Props = {
  href: string;
  title: string;
};

const NavItem: React.FC<Props> = ({ title, href }) => {
  return (
    <Link href={href} className="text-sm font-medium hover:text-primary transition-colors">
      {title}
    </Link>
  );
};

export default NavItem;
