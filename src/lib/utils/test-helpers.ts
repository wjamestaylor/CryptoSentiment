import { PrismaClient } from '@prisma/client';

// Mock Prisma context for tRPC testing
export function createMockContext(overrides: {
  session?: any;
  prisma?: Partial<PrismaClient>;
} = {}) {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userPreferences: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    cryptocurrency: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    alert: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    sentimentAnalysis: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    priceData: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    ...overrides.prisma,
  } as any;

  const mockSession = overrides.session || null;

  return {
    session: mockSession,
    prisma: mockPrisma,
  };
}

// Helper to create authenticated context
export function createAuthenticatedContext(userId: string = 'test-user-id') {
  return createMockContext({
    session: {
      user: { id: userId, email: 'test@example.com' },
      expires: '2025-01-01',
    },
  });
}

// Helper to create unauthenticated context
export function createUnauthenticatedContext() {
  return createMockContext({
    session: null,
  });
}