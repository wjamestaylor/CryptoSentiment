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

// Set up test environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    EMAIL_SERVER_HOST: 'smtp.test.com',
    EMAIL_SERVER_PORT: '587',
    EMAIL_SERVER_USER: 'test@test.com',
    EMAIL_SERVER_PASSWORD: 'test-password',
    EMAIL_FROM: 'noreply@test.com',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// Import after mocking
import { authOptions } from '@/lib/auth/nextauth';
import { getServerSession } from 'next-auth';
import { type GetServerSidePropsContext } from 'next';

// Mock next-auth getServerSession

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration Structure', () => {
    it('should export authOptions', () => {
      expect(authOptions).toBeDefined();
      expect(typeof authOptions).toBe('object');
    });

    it('should have required properties', () => {
      expect(authOptions).toHaveProperty('adapter');
      expect(authOptions).toHaveProperty('providers');
      expect(authOptions).toHaveProperty('callbacks');
      expect(authOptions).toHaveProperty('pages');
      expect(authOptions).toHaveProperty('session');
      expect(authOptions).toHaveProperty('secret');
    });

    it('should configure session strategy as database', () => {
      expect(authOptions.session?.strategy).toBe('database');
    });

    it('should have custom pages configuration', () => {
      expect(authOptions.pages).toEqual({
        signIn: '/auth/signin',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
      });
    });

    it('should have exactly 1 provider (Google only, email disabled)', () => {
      expect(authOptions.providers).toHaveLength(1);
    });

    it('should have debug configuration', () => {
      // Test that debug is set based on NODE_ENV
      expect(typeof authOptions.debug).toBe('boolean');
    });
  });

  describe('Provider Configuration', () => {
    it('should have Google provider configured (email disabled)', () => {
      expect(authOptions.providers).toHaveLength(1);
      
      // Check provider types exist
      const providerIds = authOptions.providers.map(p => p.id);
      expect(providerIds).toContain('google');
      // Email provider disabled due to NextAuth issues
    });

    it('should configure providers with environment variables', () => {
      // Test that providers are configured (they exist in the array)
      expect(authOptions.providers.length).toBeGreaterThan(0);
      
      // Test environment variables are available
      expect(process.env.GOOGLE_CLIENT_ID).toBe('test-google-client-id');
      expect(process.env.EMAIL_SERVER_HOST).toBe('smtp.test.com');
    });
  });

  describe('Callbacks', () => {
    it('should have session and signIn callbacks', () => {
      expect(authOptions.callbacks).toHaveProperty('session');
      expect(authOptions.callbacks).toHaveProperty('signIn');
      expect(typeof authOptions.callbacks?.session).toBe('function');
      expect(typeof authOptions.callbacks?.signIn).toBe('function');
    });

    it('should allow all sign ins', async () => {
      const signInCallback = authOptions.callbacks?.signIn;
      if (signInCallback) {
        const result = await signInCallback({
          user: { 
            id: '1',
            email: 'test@example.com', 
            name: 'Test',
            emailVerified: new Date()
          },
          account: { 
            type: 'oauth',
            provider: 'google',
            providerAccountId: '123'
          },
          profile: {},
        });

        expect(result).toBe(true);
      }
    });
  });

  describe('getServerAuthSession', () => {
    it('should call getServerSession with correct parameters', async () => {
      const mockSession = { 
        user: { id: '1', email: 'test@example.com' }, 
        expires: '2024-01-01' 
      };
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const { getServerAuthSession } = await import('@/lib/auth/nextauth');
      const mockReq = { headers: {} };
      const mockRes = { statusCode: 200 };
      
      const result = await getServerAuthSession({
        req: mockReq as GetServerSidePropsContext['req'],
        res: mockRes as GetServerSidePropsContext['res']
      });

      expect(getServerSession).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        authOptions
      );
      expect(result).toEqual(mockSession);
    });

    it('should return null when no session', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const { getServerAuthSession } = await import('@/lib/auth/nextauth');
      const result = await getServerAuthSession({
        req: {} as GetServerSidePropsContext['req'],
        res: {} as GetServerSidePropsContext['res']
      });

      expect(result).toBeNull();
    });
  });

  describe('Environment Variables', () => {
    it('should use configured environment variables', () => {
      expect(process.env.NEXTAUTH_SECRET).toBe('test-secret');
      expect(process.env.GOOGLE_CLIENT_ID).toBe('test-google-client-id');
      expect(process.env.EMAIL_SERVER_HOST).toBe('smtp.test.com');
      expect(authOptions.secret).toBe('test-secret');
    });
  });

  describe('Security Configuration', () => {
    it('should use PrismaAdapter for database operations', () => {
      expect(authOptions.adapter).toBeDefined();
    });

    it('should have secure configuration', () => {
      expect(authOptions.session?.strategy).toBe('database');
      expect(authOptions.pages?.signIn).toBe('/auth/signin');
      expect(authOptions.pages?.error).toBe('/auth/error');
      expect(authOptions.secret).toBe('test-secret');
    });
  });

  describe('Integration', () => {
    it('should have valid NextAuth configuration structure', () => {
      expect(authOptions).toMatchObject({
        adapter: expect.any(Object),
        providers: expect.any(Array),
        callbacks: expect.objectContaining({
          session: expect.any(Function),
          signIn: expect.any(Function),
        }),
        pages: expect.objectContaining({
          signIn: expect.any(String),
          error: expect.any(String),
          verifyRequest: expect.any(String),
        }),
        session: expect.objectContaining({
          strategy: 'database',
        }),
        secret: expect.any(String),
      });
    });

    it('should have all required providers (Google only)', () => {
      expect(authOptions.providers).toHaveLength(1);
      expect(authOptions.providers.every(p => p.id && p.name)).toBe(true);
    });
  });
});