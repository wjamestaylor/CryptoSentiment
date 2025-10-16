import { CoinGeckoService } from '@/services/crypto/price.service';
import { AlertService } from '@/services/notifications/alerts.service';
import { SentimentLabel } from '@prisma/client';

interface MonitoredCrypto {
  id: string;
  symbol: string;
  coinGeckoId?: string;
  lastPrice?: number;
  lastVolume?: number;
  lastUpdated?: Date;
}

interface PriceChange {
  cryptoId: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  volume24h: number;
}

/**
 * Real-time Alert Monitoring Service
 * Continuously monitors cryptocurrency data and triggers alerts
 */
export class AlertMonitorService {
  private coinGeckoService: CoinGeckoService;
  private alertService: AlertService;
  private monitoredCryptos: Map<string, MonitoredCrypto> = new Map();
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  
  // Configuration
  private readonly MONITOR_INTERVAL = 60000; // 1 minute
  private readonly PRICE_CHANGE_THRESHOLD = 0.05; // 5% change to trigger volume alerts
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.coinGeckoService = new CoinGeckoService();
    this.alertService = new AlertService();
  }

  /**
   * Start the alert monitoring system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Alert monitor is already running');
      return;
    }

    console.log('Starting alert monitoring system...');
    this.isRunning = true;

    // Load cryptocurrencies that have active alerts
    await this.loadMonitoredCryptos();

    // Start the monitoring loop
    this.intervalId = setInterval(async () => {
      try {
        await this.monitorLoop();
      } catch (error) {
        console.error('Error in alert monitor loop:', error);
      }
    }, this.MONITOR_INTERVAL);

    console.log(`Alert monitoring started with ${this.monitoredCryptos.size} cryptocurrencies`);
  }

  /**
   * Stop the alert monitoring system
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Alert monitor is not running');
      return;
    }

    console.log('Stopping alert monitoring system...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    console.log('Alert monitoring stopped');
  }

  /**
   * Add a cryptocurrency to monitoring
   */
  async addToMonitoring(cryptoId: string, symbol: string, coinGeckoId?: string): Promise<void> {
    const monitoredCrypto: MonitoredCrypto = {
      id: cryptoId,
      symbol: symbol.toLowerCase(),
      coinGeckoId,
    };

    this.monitoredCryptos.set(cryptoId, monitoredCrypto);
    console.log(`Added ${symbol} to alert monitoring`);
  }

  /**
   * Remove a cryptocurrency from monitoring
   */
  removeFromMonitoring(cryptoId: string): void {
    const crypto = this.monitoredCryptos.get(cryptoId);
    if (crypto) {
      this.monitoredCryptos.delete(cryptoId);
      console.log(`Removed ${crypto.symbol} from alert monitoring`);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      monitoredCount: this.monitoredCryptos.size,
      lastUpdate: new Date(),
      monitoredCryptos: Array.from(this.monitoredCryptos.values()).map(crypto => ({
        symbol: crypto.symbol,
        lastPrice: crypto.lastPrice,
        lastUpdated: crypto.lastUpdated,
      })),
    };
  }

  /**
   * Load cryptocurrencies that have active alerts
   */
  private async loadMonitoredCryptos(): Promise<void> {
    try {
      // This would typically query the database for cryptocurrencies with active alerts
      // For now, we'll add popular cryptocurrencies that users are likely to track
      const popularCryptos = [
        { id: 'bitcoin', symbol: 'btc', coinGeckoId: 'bitcoin' },
        { id: 'ethereum', symbol: 'eth', coinGeckoId: 'ethereum' },
        { id: 'solana', symbol: 'sol', coinGeckoId: 'solana' },
        { id: 'cardano', symbol: 'ada', coinGeckoId: 'cardano' },
        { id: 'polkadot', symbol: 'dot', coinGeckoId: 'polkadot' },
      ];

      for (const crypto of popularCryptos) {
        await this.addToMonitoring(crypto.id, crypto.symbol, crypto.coinGeckoId);
      }
    } catch (error) {
      console.error('Error loading monitored cryptocurrencies:', error);
    }
  }

  /**
   * Main monitoring loop
   */
  private async monitorLoop(): Promise<void> {
    if (!this.isRunning || this.monitoredCryptos.size === 0) {
      return;
    }

    console.log(`Running alert monitor check for ${this.monitoredCryptos.size} cryptocurrencies...`);
    
    try {
      // Get current market data for top cryptocurrencies
      const marketData = await this.coinGeckoService.getTopCryptos(50);

      // Process each monitored cryptocurrency
      for (const [cryptoId, crypto] of this.monitoredCryptos) {
        const currentData = marketData.find((data: any) => 
          data.symbol.toLowerCase() === crypto.symbol.toLowerCase()
        );

        if (currentData) {
          await this.processMarketData(crypto, currentData);
        }
      }

    } catch (error) {
      console.error('Error fetching market data for alert monitoring:', error);
    }
  }

  /**
   * Process market data for a specific cryptocurrency
   */
  private async processMarketData(crypto: MonitoredCrypto, marketData: any): Promise<void> {
    try {
      const previousPrice = crypto.lastPrice;
      const currentPrice = marketData.current_price;
      const volume24h = marketData.total_volume;

      // Update stored data
      crypto.lastPrice = currentPrice;
      crypto.lastVolume = volume24h;
      crypto.lastUpdated = new Date();

      // Check for price alerts if we have previous data
      if (previousPrice && Math.abs(currentPrice - previousPrice) > 0) {
        const changePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
        
        await this.checkPriceAlerts(crypto, {
          cryptoId: crypto.id,
          currentPrice,
          previousPrice,
          changePercent,
          volume24h,
        });
      }

      // Check for volume alerts
      await this.checkVolumeAlerts(crypto, volume24h);

      // Generate sentiment data for sentiment alerts (simulated for now)
      if (Math.random() < 0.1) { // 10% chance to trigger sentiment check
        await this.checkSentimentAlerts(crypto);
      }

    } catch (error) {
      console.error(`Error processing market data for ${crypto.symbol}:`, error);
    }
  }

  /**
   * Check and trigger price alerts
   */
  private async checkPriceAlerts(crypto: MonitoredCrypto, priceChange: PriceChange): Promise<void> {
    try {
      await this.alertService.checkAlerts(crypto.id, {
        cryptoId: crypto.id,
        price: priceChange.currentPrice,
        change24h: priceChange.changePercent,
        volume24h: priceChange.volume24h,
      });
    } catch (error) {
      console.error(`Error checking price alerts for ${crypto.symbol}:`, error);
    }
  }

  /**
   * Check and trigger volume alerts
   */
  private async checkVolumeAlerts(crypto: MonitoredCrypto, volume24h: number): Promise<void> {
    try {
      await this.alertService.checkAlerts(crypto.id, {
        cryptoId: crypto.id,
        volume24h,
      });
    } catch (error) {
      console.error(`Error checking volume alerts for ${crypto.symbol}:`, error);
    }
  }

  /**
   * Check and trigger sentiment alerts (simulated)
   */
  private async checkSentimentAlerts(crypto: MonitoredCrypto): Promise<void> {
    try {
      // Generate simulated sentiment data
      // In a real implementation, this would fetch actual sentiment analysis
      const sentimentScore = (Math.random() - 0.5) * 2; // -1 to 1
      const confidence = 0.7 + Math.random() * 0.3; // 0.7 to 1.0
      
      let label: SentimentLabel;
      if (sentimentScore >= 0.5) label = SentimentLabel.VERY_BULLISH;
      else if (sentimentScore >= 0.2) label = SentimentLabel.BULLISH;
      else if (sentimentScore >= -0.2) label = SentimentLabel.NEUTRAL;
      else if (sentimentScore >= -0.5) label = SentimentLabel.BEARISH;
      else label = SentimentLabel.VERY_BEARISH;

      await this.alertService.checkAlerts(crypto.id, {
        cryptoId: crypto.id,
        score: sentimentScore,
        label,
        confidence,
      });
    } catch (error) {
      console.error(`Error checking sentiment alerts for ${crypto.symbol}:`, error);
    }
  }

  /**
   * Force check alerts for a specific cryptocurrency (for testing)
   */
  async forceCheck(cryptoSymbol: string): Promise<{ success: boolean; message: string }> {
    try {
      const crypto = Array.from(this.monitoredCryptos.values()).find(
        c => c.symbol.toLowerCase() === cryptoSymbol.toLowerCase()
      );

      if (!crypto) {
        return { success: false, message: `Cryptocurrency ${cryptoSymbol} not found in monitoring` };
      }

      // Get fresh market data using search to find the CoinGecko ID
      const searchResults = await this.coinGeckoService.searchCryptos(cryptoSymbol);
      
      if (searchResults.coins.length > 0) {
        const coinId = searchResults.coins[0].id;
        const marketData = await this.coinGeckoService.getCryptoById(coinId);
        
        await this.processMarketData(crypto, marketData);
        return { success: true, message: `Alert check completed for ${cryptoSymbol}` };
      } else {
        return { success: false, message: `No market data found for ${cryptoSymbol}` };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Failed to force check: ${message}` };
    }
  }
}

// Singleton instance for global use
export const alertMonitor = new AlertMonitorService();