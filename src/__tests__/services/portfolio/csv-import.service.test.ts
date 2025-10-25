/**
 * CSV Import Service Tests
 */

import { CSVImportService } from '@/services/portfolio/csv-import.service';

describe('CSVImportService', () => {
  let service: CSVImportService;

  beforeEach(() => {
    service = new CSVImportService();
  });

  describe('parseCSV', () => {
    it('should parse valid CSV content', () => {
      const csv = 'symbol,amount,purchasePrice,purchaseDate,notes\n' +
                  'BTC,0.5,45000,2024-01-15,Initial investment\n' +
                  'ETH,2.0,2500,2024-01-20,DeFi portfolio';

      const result = service.parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        symbol: 'BTC',
        amount: 0.5,
        purchasePrice: 45000,
        purchaseDate: new Date('2024-01-15'),
        notes: 'Initial investment',
      });
      expect(result.errors).toHaveLength(0);
    });

    it('should handle CSV with only required fields', () => {
      const csv = 'symbol,amount\nBTC,0.5\nETH,2.0';

      const result = service.parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        symbol: 'BTC',
        amount: 0.5,
      });
    });

    it('should handle empty CSV', () => {
      const csv = '';

      const result = service.parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('CSV file is empty');
    });

    it('should handle missing symbol column', () => {
      const csv = 'amount,price\n0.5,45000';

      const result = service.parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('CSV must contain a "symbol" column');
    });

    it('should handle missing amount column', () => {
      const csv = 'symbol,price\nBTC,45000';

      const result = service.parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('CSV must contain an "amount" column');
    });

    it('should handle invalid amount values', () => {
      const csv = 'symbol,amount\nBTC,invalid';

      const result = service.parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid amount');
    });

    it('should handle negative amounts', () => {
      const csv = 'symbol,amount\nBTC,-0.5';

      const result = service.parseCSV(csv);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid amount');
    });

    it('should handle quoted values with commas', () => {
      const csv = 'symbol,amount,notes\nBTC,0.5,"Initial investment, long term"';

      const result = service.parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.data[0]?.notes).toBe('Initial investment, long term');
    });

    it('should warn about unrecognized symbols', () => {
      const csv = 'symbol,amount\nINVALIDCOIN,100';

      const result = service.parseCSV(csv);

      expect(result.success).toBe(true); // Success but with warnings
      expect(result.data).toHaveLength(1); // Data is still imported
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('not recognized');
    });

    it('should handle alternative header names', () => {
      const csv = 'coin,quantity\nBTC,0.5';

      const result = service.parseCSV(csv);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('generateTemplate', () => {
    it('should generate valid CSV template', () => {
      const template = service.generateTemplate();

      expect(template).toContain('symbol,amount');
      expect(template).toContain('BTC');
      expect(template).toContain('ETH');
    });

    it('should generate parseable template', () => {
      const template = service.generateTemplate();
      const result = service.parseCSV(template);

      expect(result.success).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });
});
