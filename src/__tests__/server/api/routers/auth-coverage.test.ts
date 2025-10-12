/**
 * Coverage tests for auth tRPC router
 */

// Mock superjson first
jest.mock('superjson', () => ({
  serialize: jest.fn(),
  deserialize: jest.fn(),
  stringify: jest.fn(),
  parse: jest.fn(),
}));

// Mock external dependencies
jest.mock('next-auth/providers/google', () => {
  return jest.fn(() => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
  }));
});

jest.mock('next-auth/providers/email', () => {
  return jest.fn(() => ({
    id: 'email',
    name: 'Email',
    type: 'email',
  }));
});

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('jose', () => ({}));
jest.mock('openid-client', () => ({}));

jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}));

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Import to get coverage
import { authRouter } from '@/server/api/routers/auth';

describe('Auth Router Coverage', () => {
  it('should import the auth router successfully', () => {
    expect(authRouter).toBeDefined();
    expect(typeof authRouter).toBe('object');
  });

  it('should have required procedures', () => {
    expect(authRouter._def.procedures).toBeDefined();
    expect(authRouter._def.procedures.getSession).toBeDefined();
  });

  it('should have correct procedure types', () => {
    const procedures = authRouter._def.procedures;
    expect(procedures.getSession._def.type).toBe('query');
  });
});