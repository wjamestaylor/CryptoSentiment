/**
 * Binance Import Service
 * 
 * Integrates with Binance API to fetch portfolio holdings
 * Reference: https://binance-docs.github.io/apidocs/spot/en/#account-information-user_data
 */

import crypto from 'crypto';
import { 
  ExchangeImportService, 
  type ExchangeCredentials, 
  type ExchangeImportResult,
  type ExchangeHolding 
} from './exchange-import.service';

export class BinanceImportService extends ExchangeImportService {
  private readonly baseUrl = 'https://api.binance.com';

  getExchangeName(): string {
    return 'Binance';
  }

  async verifyCredentials(credentials: ExchangeCredentials): Promise<boolean> {
    const validation = this.validateCredentials(credentials);
    if (!validation.valid) {
      return false;
    }

    try {
      const response = await this.makeRequest(credentials, '/api/v3/account');
      return response.ok;
    } catch (error) {
      console.error('Binance credentials verification failed:', error);
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
      // Fetch account information
      const response = await this.makeRequest(credentials, '/api/v3/account');

      if (!response.ok) {
        const errorText = await response.text();
        errors.push(`Binance API error: ${response.status} - ${errorText}`);
        return { success: false, holdings: [], errors, warnings };
      }

      const data = await response.json() as { 
        balances: Array<{
          asset: string;
          free: string;
          locked: string;
        }> 
      };

      if (!data.balances || !Array.isArray(data.balances)) {
        errors.push('Invalid response format from Binance');
        return { success: false, holdings: [], errors, warnings };
      }

      // Parse balances into holdings
      for (const balance of data.balances) {
        const availableAmount = parseFloat(balance.free);
        const lockedAmount = parseFloat(balance.locked);
        const amount = availableAmount + lockedAmount;

        if (amount > 0) {
          holdings.push({
            symbol: balance.asset,
            amount,
            availableAmount,
            lockedAmount,
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
      errors.push(`Failed to fetch Binance holdings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, holdings: [], errors, warnings };
    }
  }

  /**
   * Make authenticated request to Binance API
   */
  private async makeRequest(
    credentials: ExchangeCredentials,
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<Response> {
    const timestamp = Date.now().toString();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp,
    });

    // Create signature
    const signature = crypto
      .createHmac('sha256', credentials.apiSecret)
      .update(queryParams.toString())
      .digest('hex');

    queryParams.append('signature', signature);

    const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;

    return fetch(url, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': credentials.apiKey,
      },
    });
  }
}

// Export singleton instance
export const binanceImportService = new BinanceImportService();
