import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

export const createMockContext = () => {
  const prismaMock = mockDeep<PrismaClient>();
  
  return {
    prisma: prismaMock,
    session: null,
    // Add other context properties that tRPC expects
  };
};

export const createMockTRPCContext = createMockContext;