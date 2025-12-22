import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

type Props = {
  title: string;
  author: string;
  slug: string;
  bookCover: string;
};

const FeaturedBookCard: React.FC<Props> = ({ title, slug, author, bookCover }) => {
  const t = useTranslations('General');
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-2/3 relative bg-muted">
        <Image src={bookCover} alt={title} fill className="object-cover w-full h-full" />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-1 text-pretty">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{t('byAuthor', { author })}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" className="w-full bg-transparent" asChild>
          <Link href={`/books/${slug}`}>{t('viewDetails')}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FeaturedBookCard;
