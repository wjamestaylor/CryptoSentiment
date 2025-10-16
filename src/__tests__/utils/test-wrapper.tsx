import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

interface TestWrapperProps {
  children: ReactNode;
  session?: Session | null;
}

const mockSession: Session = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: '2024-12-31T23:59:59Z',
};

export function TestWrapper({ children, session = mockSession }: TestWrapperProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}

export { mockSession };

// This file is a utility for tests, not a test file itself
// Jest requires test files to have at least one test, but this is just a helper