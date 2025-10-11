// Mock NextAuth completely to avoid ES module issues
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/next', () => ({
  NextAuthHandler: jest.fn(),
}));

jest.mock('next-auth/providers/google', () => ({
  default: jest.fn(() => ({ id: 'google', name: 'Google' })),
}));

jest.mock('next-auth/providers/email', () => ({
  default: jest.fn(() => ({ id: 'email', name: 'Email' })),
}));

jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}));