import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import Container from '@/components/container';

const LoadingPage: React.FC = () => {
  return (
    <Container className="h-[60vh] flex flex-col items-center justify-center">
      <Spinner className="size-20 text-primary" />
    </Container>
  );
};

export default LoadingPage;
