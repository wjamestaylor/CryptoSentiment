/**
 * Tests for NextAuth environment variable validation
 */

describe('NextAuth Environment Variable Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to get fresh import
    jest.resetModules();
    // Clear environment
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should not throw error when all required variables are present in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.EMAIL_SERVER_HOST = 'smtp.test.com';
    process.env.EMAIL_SERVER_PORT = '587';
    process.env.EMAIL_SERVER_USER = 'test@test.com';
    process.env.EMAIL_SERVER_PASSWORD = 'test-password';
    process.env.EMAIL_FROM = 'noreply@test.com';

    // Should not throw
    expect(() => {
      require('@/lib/auth/nextauth');
    }).not.toThrow();
  });

  it('should throw error in production when GOOGLE_CLIENT_ID is missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    // Missing GOOGLE_CLIENT_ID
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.EMAIL_SERVER_HOST = 'smtp.test.com';
    process.env.EMAIL_SERVER_PORT = '587';
    process.env.EMAIL_SERVER_USER = 'test@test.com';
    process.env.EMAIL_SERVER_PASSWORD = 'test-password';
    process.env.EMAIL_FROM = 'noreply@test.com';

    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/Missing required environment variables for authentication: GOOGLE_CLIENT_ID/);
  });

  it('should throw error in production when GOOGLE_CLIENT_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    // Missing GOOGLE_CLIENT_SECRET
    process.env.EMAIL_SERVER_HOST = 'smtp.test.com';
    process.env.EMAIL_SERVER_PORT = '587';
    process.env.EMAIL_SERVER_USER = 'test@test.com';
    process.env.EMAIL_SERVER_PASSWORD = 'test-password';
    process.env.EMAIL_FROM = 'noreply@test.com';

    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/Missing required environment variables for authentication: GOOGLE_CLIENT_SECRET/);
  });

  it('should throw error in production when multiple variables are missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    // Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and EMAIL_FROM

    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/Missing required environment variables for authentication/);
  });

  it('should throw error when VALIDATE_ENV is true even in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.VALIDATE_ENV = 'true';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    // Missing Google OAuth credentials

    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/Missing required environment variables for authentication/);
  });

  it('should include helpful error message with missing variables', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXTAUTH_SECRET = 'test-secret';

    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/Please check your \.env file/);
    
    expect(() => {
      require('@/lib/auth/nextauth');
    }).toThrow(/See \.env\.example/);
  });
});
