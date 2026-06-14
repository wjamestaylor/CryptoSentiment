/**
 * CSV Import Service
 * 
 * Handles parsing and validation of CSV files for portfolio import
 */

import { getCoinGeckoId } from '@/lib/crypto-mappings';

export interface CSVImportRow {
  symbol: string;
  amount: number;
  purchasePrice?: number;
  purchaseDate?: Date;
  notes?: string;
}

export interface CSVImportResult {
  success: boolean;
  data: CSVImportRow[];
  errors: string[];
  warnings: string[];
}

export class CSVImportService {
  /**
   * Parse CSV content and validate data
   */
  parseCSV(csvContent: string): CSVImportResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const data: CSVImportRow[] = [];

    try {
      // Split by lines and remove empty lines
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        errors.push('CSV file is empty');
        return { success: false, data: [], errors, warnings };
      }

      // Parse header
      const header = this.parseCSVLine(lines[0] || '');
      const headerMap = this.mapHeaders(header);

      if (headerMap.symbol === undefined) {
        errors.push('CSV must contain a "symbol" column');
        return { success: false, data: [], errors, warnings };
      }

      if (headerMap.amount === undefined) {
        errors.push('CSV must contain an "amount" column');
        return { success: false, data: [], errors, warnings };
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || !line.trim()) continue;

        const values = this.parseCSVLine(line);
        const rowResult = this.parseRow(values, headerMap, i + 1);

        if (rowResult.error) {
          errors.push(`Row ${i + 1}: ${rowResult.error}`);
        }
        
        if (rowResult.warning) {
          warnings.push(`Row ${i + 1}: ${rowResult.warning}`);
        }

        if (rowResult.data) {
          data.push(rowResult.data);
        }
      }

      return {
        success: errors.length === 0 && data.length > 0,
        data,
        errors,
        warnings,
      };

    } catch (error) {
      errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, data: [], errors, warnings };
    }
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Map CSV headers to expected fields
   */
  private mapHeaders(header: string[]): Record<string, number> {
    const map: Record<string, number> = {};

    header.forEach((col, index) => {
      const normalized = col.toLowerCase().trim();
      
      if (normalized === 'symbol' || normalized === 'coin' || normalized === 'cryptocurrency') {
        map.symbol = index;
      } else if (normalized === 'amount' || normalized === 'quantity' || normalized === 'holdings') {
        map.amount = index;
      } else if (normalized === 'price' || normalized === 'purchaseprice' || normalized === 'purchase_price') {
        map.purchasePrice = index;
      } else if (normalized === 'date' || normalized === 'purchasedate' || normalized === 'purchase_date') {
        map.purchaseDate = index;
      } else if (normalized === 'notes' || normalized === 'note') {
        map.notes = index;
      }
    });

    return map;
  }

  /**
   * Parse a single row of data
   */
  private parseRow(
    values: string[], 
    headerMap: Record<string, number>, 
    _rowNumber: number
  ): { data?: CSVImportRow; error?: string; warning?: string } {
    const symbol = values[headerMap.symbol]?.trim().toUpperCase();
    const amountStr = values[headerMap.amount]?.trim();

    if (!symbol) {
      return { error: 'Missing symbol' };
    }

    if (!amountStr) {
      return { error: 'Missing amount' };
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return { error: 'Invalid amount (must be a positive number)' };
    }

    const row: CSVImportRow = {
      symbol,
      amount,
    };

    // Optional fields
    if (headerMap.purchasePrice !== undefined) {
      const priceStr = values[headerMap.purchasePrice]?.trim();
      if (priceStr) {
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0) {
          row.purchasePrice = price;
        }
      }
    }

    if (headerMap.purchaseDate !== undefined) {
      const dateStr = values[headerMap.purchaseDate]?.trim();
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          row.purchaseDate = date;
        }
      }
    }

    if (headerMap.notes !== undefined) {
      const notes = values[headerMap.notes]?.trim();
      if (notes) {
        row.notes = notes;
      }
    }

    // Validate symbol is recognized (warning, not error)
    const coinGeckoId = getCoinGeckoId(symbol);
    if (!coinGeckoId) {
      return { 
        data: row,
        warning: `Symbol "${symbol}" not recognized - may need manual verification` 
      };
    }

    return { data: row };
  }

  /**
   * Generate sample CSV template
   */
  generateTemplate(): string {
    return [
      'symbol,amount,purchasePrice,purchaseDate,notes',
      'BTC,0.5,45000,2024-01-15,Initial investment',
      'ETH,2.0,2500,2024-01-20,DeFi portfolio',
      'SOL,10,100,2024-02-01,High risk allocation',
    ].join('\n');
  }
}

// Export singleton instance
export const csvImportService = new CSVImportService();
