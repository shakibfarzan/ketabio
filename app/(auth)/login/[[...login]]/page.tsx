import React from 'react';
import { SignIn } from '@clerk/nextjs';
import { shadcn } from '@clerk/themes';
import Container from '@/components/container';

const LoginPage: React.FC = async () => {
  return (
    <Container className="flex items-center justify-center w-full">
      <SignIn
        appearance={{
          theme: shadcn,
        }}
      />
    </Container>
  );
};

export default LoginPage;
