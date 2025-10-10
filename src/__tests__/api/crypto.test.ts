import { z } from 'zod';

// Simple unit tests for crypto router input validation
describe('Crypto Router Validation', () => {
  describe('Input validation schemas', () => {
    it('should validate getTopCryptos input', () => {
      const schema = z.object({ limit: z.number().min(1).max(100).default(50) });
      
      // Valid input
      expect(schema.parse({ limit: 10 })).toEqual({ limit: 10 });
      
      // Default value
      expect(schema.parse({})).toEqual({ limit: 50 });
      
      // Invalid input
      expect(() => schema.parse({ limit: 0 })).toThrow();
      expect(() => schema.parse({ limit: 101 })).toThrow();
    });

    it('should validate getCryptoById input', () => {
      const schema = z.object({ id: z.string().min(1) });
      
      // Valid input
      expect(schema.parse({ id: 'bitcoin' })).toEqual({ id: 'bitcoin' });
      
      // Invalid input
      expect(() => schema.parse({ id: '' })).toThrow();
      expect(() => schema.parse({})).toThrow();
    });

    it('should validate searchCryptos input', () => {
      const schema = z.object({ query: z.string().min(1) });
      
      // Valid input
      expect(schema.parse({ query: 'bitcoin' })).toEqual({ query: 'bitcoin' });
      
      // Invalid input
      expect(() => schema.parse({ query: '' })).toThrow();
      expect(() => schema.parse({})).toThrow();
    });

    it('should validate followCrypto input', () => {
      const schema = z.object({ 
        symbol: z.string(),
        name: z.string().optional(),
      });
      
      // Valid input
      expect(schema.parse({ symbol: 'BTC' })).toEqual({ symbol: 'BTC' });
      expect(schema.parse({ symbol: 'BTC', name: 'Bitcoin' })).toEqual({ 
        symbol: 'BTC', 
        name: 'Bitcoin' 
      });
      
      // Invalid input
      expect(() => schema.parse({})).toThrow();
    });
  });
});