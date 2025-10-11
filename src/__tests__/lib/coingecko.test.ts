// Mock external dependencies for testing
global.fetch = jest.fn();

// Basic test file to cover empty CoinGecko service
describe('CoinGecko Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should exist as a module', () => {
    // This will at least require the module and check for syntax errors
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expect(() => require('@/lib/api/coingecko')).not.toThrow();
  });

  it('should have basic structure when imported', async () => {
    // Test basic module loading without full instantiation
    const coinGeckoModule = await import('@/lib/api/coingecko');
    expect(coinGeckoModule).toBeDefined();
  });
});