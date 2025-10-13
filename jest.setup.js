import '@testing-library/jest-dom'

// Mock NextAuth to avoid ES module issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./src/__tests__/__mocks__/next-auth.mock')

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next.js server components
Object.defineProperty(globalThis, 'Request', {
  value: class Request {
    constructor(input, init) {
      Object.defineProperty(this, 'url', {
        value: input,
        writable: false,
        configurable: true
      });
      this.method = init?.method || 'GET';
      this.headers = new Map();
      Object.entries(init?.headers || {}).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
      this._body = init?.body;
    }
    
    async json() {
      if (!this._body) {
        throw new Error('Request body is empty');
      }
      return JSON.parse(this._body);
    }
    
    async text() {
      if (!this._body) {
        return '';
      }
      return this._body;
    }
  },
  writable: true,
});

Object.defineProperty(globalThis, 'Response', {
  value: class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new Map();
      Object.entries(init?.headers || {}).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
    
    async json() {
      return JSON.parse(this.body);
    }
    
    static json(object, init) {
      return new Response(JSON.stringify(object), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      });
    }
  },
  writable: true,
});

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.OPENROUTER_API_KEY = 'test-api-key'
process.env.COINGECKO_API_KEY = 'test-api-key'