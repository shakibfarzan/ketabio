import React from 'react';
import { SignUp } from '@clerk/nextjs';
import Container from '@/components/container';
import { shadcn } from '@clerk/themes';

const SignUpPage: React.FC = () => {
  return (
    <Container className="flex items-center justify-center w-full">
      <SignUp
        appearance={{
          theme: shadcn,
        }}
      />
    </Container>
  );
};

export default SignUpPage;
