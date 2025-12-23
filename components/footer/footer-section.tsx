import React from 'react';
import Link from 'next/link';

type Props = {
  title: string;
  links: { href: string; title: string }[];
};

const FooterSection: React.FC<Props> = ({ links, title }) => {
  return (
    <div>
      <h4 className="font-semibold mb-4">{title}</h4>
      <ul className="space-y-2 text-sm">
        {links.map(({ href, title }) => (
          <li key={title}>
            <Link
              href={href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterSection;
