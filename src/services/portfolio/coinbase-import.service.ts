/**
 * Coinbase Import Service
 * 
 * Integrates with Coinbase API to fetch portfolio holdings
 * Reference: https://docs.cloud.coinbase.com/sign-in-with-coinbase/docs/api-users
 */

import crypto from 'crypto';
import { 
  ExchangeImportService, 
  type ExchangeCredentials, 
  type ExchangeImportResult,
  type ExchangeHolding 
} from './exchange-import.service';

export class CoinbaseImportService extends ExchangeImportService {
  private readonly baseUrl = 'https://api.coinbase.com/v2';

  getExchangeName(): string {
    return 'Coinbase';
  }

  async verifyCredentials(credentials: ExchangeCredentials): Promise<boolean> {
    const validation = this.validateCredentials(credentials);
    if (!validation.valid) {
      return false;
    }

    try {
      const response = await this.makeRequest(credentials, '/user', 'GET');
      return response.ok;
    } catch (error) {
      console.error('Coinbase credentials verification failed:', error);
      return false;
    }
  }

  async fetchHoldings(credentials: ExchangeCredentials): Promise<ExchangeImportResult> {
    const validation = this.validateCredentials(credentials);
    if (!validation.valid) {
      return {
        success: false,
        holdings: [],
        errors: [validation.error || 'Invalid credentials'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const holdings: ExchangeHolding[] = [];

    try {
      // Fetch all accounts (wallets)
      const response = await this.makeRequest(credentials, '/accounts', 'GET');

      if (!response.ok) {
        const errorText = await response.text();
        errors.push(`Coinbase API error: ${response.status} - ${errorText}`);
        return { success: false, holdings: [], errors, warnings };
      }

      const data = await response.json() as { data: Array<{
        currency: { code: string };
        balance: { amount: string };
        available_balance?: { amount: string };
      }> };

      if (!data.data || !Array.isArray(data.data)) {
        errors.push('Invalid response format from Coinbase');
        return { success: false, holdings: [], errors, warnings };
      }

      // Parse accounts into holdings
      for (const account of data.data) {
        const symbol = account.currency.code;
        const amount = parseFloat(account.balance.amount);
        const availableAmount = account.available_balance 
          ? parseFloat(account.available_balance.amount)
          : amount;

        if (amount > 0) {
          holdings.push({
            symbol,
            amount,
            availableAmount,
            lockedAmount: amount - availableAmount,
          });
        }
      }

      // Filter out dust
      const filteredHoldings = this.filterHoldings(holdings);

      return {
        success: true,
        holdings: filteredHoldings,
        errors: [],
        warnings: filteredHoldings.length < holdings.length 
          ? ['Some very small balances were filtered out'] 
          : [],
      };

    } catch (error) {
      errors.push(`Failed to fetch Coinbase holdings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, holdings: [], errors, warnings };
    }
  }

  /**
   * Make authenticated request to Coinbase API
   */
  private async makeRequest(
    credentials: ExchangeCredentials,
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: string
  ): Promise<Response> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const url = `${this.baseUrl}${endpoint}`;
    
    // Create signature
    const message = timestamp + method + endpoint.split('?')[0] + (body || '');
    const signature = crypto
      .createHmac('sha256', credentials.apiSecret)
      .update(message)
      .digest('hex');

    const headers: Record<string, string> = {
      'CB-ACCESS-KEY': credentials.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-VERSION': '2024-01-01',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(url, {
      method,
      headers,
      body,
    });
  }
}

// Export singleton instance
export const coinbaseImportService = new CoinbaseImportService();
