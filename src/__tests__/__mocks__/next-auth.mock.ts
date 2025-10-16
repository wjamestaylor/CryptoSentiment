// Mock NextAuth completely to avoid ES module issues
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/next', () => ({
  NextAuthHandler: jest.fn(),
}));

jest.mock('next-auth/providers/google', () => {
  const mockProvider = {
    id: 'google',
    name: 'Google',
    type: 'oauth',
    checks: ['pkce', 'state'],
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  };
  
  return {
    __esModule: true,
    default: jest.fn(() => mockProvider),
  };
});

jest.mock('next-auth/providers/email', () => ({
  __esModule: true,
  default: jest.fn(() => ({ id: 'email', name: 'Email' })),
}));

jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}));