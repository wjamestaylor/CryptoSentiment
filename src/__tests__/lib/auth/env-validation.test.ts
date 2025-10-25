/**
 * Tests for NextAuth environment variable validation
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

  it('should not throw error when all required variables are present in development', () => {
    setupTestEnv({ NODE_ENV: 'development' });

    // Should not throw
    expect(() => {
      require('@/lib/auth/nextauth');
    }).not.toThrow();
  });

  it('should throw error in production when GOOGLE_CLIENT_ID is missing', () => {
    setupTestEnv({
      NODE_ENV: 'production',
      GOOGLE_CLIENT_ID: undefined,
    });

    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/Missing required environment variables for authentication: GOOGLE_CLIENT_ID/);
  });

  it('should throw error in production when GOOGLE_CLIENT_SECRET is missing', () => {
    setupTestEnv({
      NODE_ENV: 'production',
      GOOGLE_CLIENT_SECRET: undefined,
    });

    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/Missing required environment variables for authentication: GOOGLE_CLIENT_SECRET/);
  });

  it('should throw error in production when multiple variables are missing', () => {
    setupTestEnv({
      NODE_ENV: 'production',
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      EMAIL_FROM: undefined,
    });

    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/Missing required environment variables for authentication/);
  });

  it('should throw error when VALIDATE_ENV is true even in development', () => {
    setupTestEnv({
      NODE_ENV: 'development',
      VALIDATE_ENV: 'true',
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
    });

    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/Missing required environment variables for authentication/);
  });

  it('should include helpful error message with missing variables', () => {
    setupTestEnv({
      NODE_ENV: 'production',
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
    });

    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/Please check your \.env file/);
    
    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/See \.env\.example/);
  });
});
