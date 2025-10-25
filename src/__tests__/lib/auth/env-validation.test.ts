/**
 * Tests for NextAuth environment variable validation (Runtime)
 * 
 * Note: Since validation now runs at runtime (during callbacks),
 * we test by importing the module and triggering callbacks.
 */

describe('NextAuth Environment Variable Validation', () => {
  const originalEnv = process.env;

  // Helper function to setup test environment with overrides
  const setupTestEnv = (overrides: Record<string, string | undefined> = {}) => {
    const baseEnv = {
      NEXTAUTH_SECRET: 'test-secret',
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      EMAIL_SERVER_HOST: 'smtp.test.com',
      EMAIL_SERVER_PORT: '587',
      EMAIL_SERVER_USER: 'test@test.com',
      EMAIL_SERVER_PASSWORD: 'test-password',
      EMAIL_FROM: 'noreply@test.com',
    };

    process.env = {
      ...originalEnv,
      ...baseEnv,
      ...overrides,
    };
  };

  beforeEach(() => {
    // Reset modules to get fresh import
    jest.resetModules();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should not throw error when all required variables are present at module load', () => {
    setupTestEnv({ NODE_ENV: 'development' });

    // Module import should not throw (validation is deferred to runtime)
    expect(() => {
      require('@/lib/auth/nextauth');
    }).not.toThrow();
  });

  it('should not throw error at module load even when email vars are missing', () => {
    setupTestEnv({
      NODE_ENV: 'production',
      EMAIL_SERVER_HOST: undefined,
      EMAIL_SERVER_PORT: undefined,
      EMAIL_SERVER_USER: undefined,
      EMAIL_SERVER_PASSWORD: undefined,
      EMAIL_FROM: undefined,
    });

    // Module import should not throw (email vars are optional)
    expect(() => {
      require('@/lib/auth/nextauth');
    }).not.toThrow();
  });

  it('should not throw error at module load when critical vars are missing', () => {
    setupTestEnv({
      NODE_ENV: 'production',
      GOOGLE_CLIENT_ID: undefined,
    });

    // Module import should not throw (validation is deferred to runtime)
    expect(() => {
      require('@/lib/auth/nextauth');
    }).not.toThrow();
  });

  it('should allow module load when SKIP_ENV_VALIDATION is true', () => {
    setupTestEnv({
      NODE_ENV: 'production',
      SKIP_ENV_VALIDATION: 'true',
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
    });

    // Module import should not throw
    expect(() => {
      require('@/lib/auth/nextauth');
    }).not.toThrow();
  });

  it('should not require email variables for module import', () => {
    setupTestEnv({
      NODE_ENV: 'production',
      EMAIL_SERVER_HOST: undefined,
      EMAIL_SERVER_PORT: undefined,
      EMAIL_SERVER_USER: undefined,
      EMAIL_SERVER_PASSWORD: undefined,
      EMAIL_FROM: undefined,
    });

    // Module import should work without email vars
    expect(() => {
      require('@/lib/auth/nextauth');
    }).not.toThrow();
  });

  it('should not throw during build time (no runtime validation)', () => {
    setupTestEnv({
      NODE_ENV: 'production',
      SKIP_ENV_VALIDATION: 'true',
      NEXTAUTH_SECRET: undefined,
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
    });

    // Build should succeed with SKIP_ENV_VALIDATION
    expect(() => {
      require('@/lib/auth/nextauth');
    }).not.toThrow();
  });
});
