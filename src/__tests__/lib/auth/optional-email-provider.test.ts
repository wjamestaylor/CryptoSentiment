/**
 * Tests for optional EmailProvider behavior in NextAuth
 * 
 * This test file verifies that the EmailProvider is only included
 * when all SMTP environment variables are present.
 */

// Mock NextAuth providers before any imports
jest.mock('next-auth/providers/google', () => {
  return jest.fn().mockImplementation((config) => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
    ...config,
  }));
});

jest.mock('next-auth/providers/email', () => {
  return jest.fn().mockImplementation((config) => ({
    id: 'email',
    name: 'Email',
    type: 'email',
    ...config,
  }));
});

jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));

jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('NextAuth Optional Email Provider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should include EmailProvider when all SMTP env vars are present', () => {
    process.env = {
      ...originalEnv,
      NEXTAUTH_SECRET: 'test-secret',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      EMAIL_SERVER_HOST: 'smtp.test.com',
      EMAIL_SERVER_PORT: '587',
      EMAIL_SERVER_USER: 'test@test.com',
      EMAIL_SERVER_PASSWORD: 'test-password',
      EMAIL_FROM: 'noreply@test.com',
    };

    const { authOptions } = require('@/lib/auth/nextauth');

    expect(authOptions.providers).toHaveLength(2);
    const providerIds = authOptions.providers.map((p: any) => p.id);
    expect(providerIds).toContain('google');
    expect(providerIds).toContain('email');
  });

  it('should only include Google provider when EMAIL_SERVER_HOST is missing', () => {
    process.env = {
      ...originalEnv,
      NEXTAUTH_SECRET: 'test-secret',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      // EMAIL_SERVER_HOST is missing
      EMAIL_SERVER_PORT: '587',
      EMAIL_SERVER_USER: 'test@test.com',
      EMAIL_SERVER_PASSWORD: 'test-password',
      EMAIL_FROM: 'noreply@test.com',
    };

    const { authOptions } = require('@/lib/auth/nextauth');

    expect(authOptions.providers).toHaveLength(1);
    expect(authOptions.providers[0].id).toBe('google');
  });

  it('should only include Google provider when EMAIL_SERVER_PORT is missing', () => {
    process.env = {
      ...originalEnv,
      NEXTAUTH_SECRET: 'test-secret',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      EMAIL_SERVER_HOST: 'smtp.test.com',
      // EMAIL_SERVER_PORT is missing
      EMAIL_SERVER_USER: 'test@test.com',
      EMAIL_SERVER_PASSWORD: 'test-password',
      EMAIL_FROM: 'noreply@test.com',
    };

    const { authOptions } = require('@/lib/auth/nextauth');

    expect(authOptions.providers).toHaveLength(1);
    expect(authOptions.providers[0].id).toBe('google');
  });

  it('should only include Google provider when all email vars are missing', () => {
    process.env = {
      ...originalEnv,
      NEXTAUTH_SECRET: 'test-secret',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      // All email vars missing
    };

    const { authOptions } = require('@/lib/auth/nextauth');

    expect(authOptions.providers).toHaveLength(1);
    expect(authOptions.providers[0].id).toBe('google');
  });

  it('should work with SKIP_ENV_VALIDATION during build', () => {
    process.env = {
      ...originalEnv,
      SKIP_ENV_VALIDATION: 'true',
      // Minimal env vars, simulating build time
      NEXTAUTH_SECRET: 'test-secret',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
    };

    const { authOptions } = require('@/lib/auth/nextauth');

    // Should have at least Google provider
    expect(authOptions.providers.length).toBeGreaterThanOrEqual(1);
    expect(authOptions.providers[0].id).toBe('google');
  });
});
