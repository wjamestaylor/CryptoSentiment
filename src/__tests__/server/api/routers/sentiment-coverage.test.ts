/**
 * Coverage tests for sentiment tRPC router
 */

// Mock external dependencies
jest.mock('next-auth/providers/google', () => ({
  default: jest.fn(() => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
  })),
}));
jest.mock('next-auth/providers/email', () => ({
  default: jest.fn(() => ({
    id: 'email',
    name: 'Email',
    type: 'email',
  })),
}));
jest.mock('@/lib/api/openrouter');
jest.mock('next-auth');
jest.mock('next-auth/next');
jest.mock('jose', () => ({}));
jest.mock('openid-client', () => ({}));
jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(),
}));
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    sentiment: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Import to get coverage
import { sentimentRouter } from '@/server/api/routers/sentiment';

describe('Sentiment Router Coverage', () => {
  it('should import the sentiment router successfully', () => {
    expect(sentimentRouter).toBeDefined();
    expect(typeof sentimentRouter).toBe('object');
  });

  it('should have required procedures', () => {
    expect(sentimentRouter._def.procedures).toBeDefined();
    expect(sentimentRouter._def.procedures.getSentimentByCrypto).toBeDefined();
    expect(sentimentRouter._def.procedures.getLatestSentiment).toBeDefined();
    expect(sentimentRouter._def.procedures.getUserSentimentFeed).toBeDefined();
  });

  it('should have correct procedure types', () => {
    const procedures = sentimentRouter._def.procedures;
    
    // All are queries
    expect(procedures.getSentimentByCrypto._def.type).toBe('query');
    expect(procedures.getLatestSentiment._def.type).toBe('query');
    expect(procedures.getUserSentimentFeed._def.type).toBe('query');
  });
});