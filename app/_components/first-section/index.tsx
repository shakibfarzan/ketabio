import React from 'react';
import LeftSection from '@/app/_components/first-section/left-section';
import Image from 'next/image';
import Container from '@/components/container';

const FirstSection: React.FC = () => {
  return (
    <Container className="flex flex-col lg:flex-row gap-8 items-center justify-between">
      <LeftSection />
      <div className="relative lg:w-2/3 w-full aspect-video">
        <Image
          src="/ketabio landing page.png"
          alt="landing page image"
          fill
          className="object-cover rounded-2xl"
          sizes="100vw"
        />
      </div>
    </Container>
  );
};

export default FirstSection;
