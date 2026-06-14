/**
 * Exchange Import Service
 * 
 * Base interfaces and utilities for exchange API integrations
 */

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  apiPassphrase?: string; // Used by some exchanges like Coinbase
}

export interface ExchangeHolding {
  symbol: string;
  amount: number;
  availableAmount?: number;
  lockedAmount?: number;
}

export interface ExchangeImportResult {
  success: boolean;
  holdings: ExchangeHolding[];
  errors: string[];
  warnings: string[];
}

export abstract class ExchangeImportService {
  /**
   * Verify API credentials are valid
   */
  abstract verifyCredentials(credentials: ExchangeCredentials): Promise<boolean>;

  /**
   * Fetch holdings from exchange
   */
  abstract fetchHoldings(credentials: ExchangeCredentials): Promise<ExchangeImportResult>;

  /**
   * Get exchange name
   */
  abstract getExchangeName(): string;

  /**
   * Validate credentials format
   */
  protected validateCredentials(credentials: ExchangeCredentials): { valid: boolean; error?: string } {
    if (!credentials.apiKey || credentials.apiKey.trim().length === 0) {
      return { valid: false, error: 'API key is required' };
    }

    if (!credentials.apiSecret || credentials.apiSecret.trim().length === 0) {
      return { valid: false, error: 'API secret is required' };
    }

    return { valid: true };
  }

  /**
   * Filter out zero balances and dust
   */
  protected filterHoldings(holdings: ExchangeHolding[], minAmount = 0.00000001): ExchangeHolding[] {
    return holdings.filter(h => h.amount > minAmount);
  }
}
