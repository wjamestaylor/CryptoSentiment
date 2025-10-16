import { AlertMonitorService } from '@/services/monitoring/alert-monitor.service';
import { CoinGeckoService } from '@/services/crypto/price.service';
import { AlertService } from '@/services/notifications/alerts.service';

// Mock the dependencies
jest.mock('@/services/crypto/price.service');
jest.mock('@/services/notifications/alerts.service');

const MockCoinGeckoService = CoinGeckoService as jest.MockedClass<typeof CoinGeckoService>;
const MockAlertService = AlertService as jest.MockedClass<typeof AlertService>;

describe('AlertMonitorService', () => {
  let alertMonitor: AlertMonitorService;
  let mockCoinGeckoService: jest.Mocked<CoinGeckoService>;
  let mockAlertService: jest.Mocked<AlertService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mocked instances
    mockCoinGeckoService = {
      getTopCryptos: jest.fn(),
      getCryptoById: jest.fn(),
      searchCryptos: jest.fn(),
    } as any;

    mockAlertService = {
      checkAlerts: jest.fn(),
    } as any;

    // Mock the constructors
    MockCoinGeckoService.mockImplementation(() => mockCoinGeckoService);
    MockAlertService.mockImplementation(() => mockAlertService);

    alertMonitor = new AlertMonitorService();
  });

  afterEach(() => {
    // Clean up any running monitors
    alertMonitor.stop();
  });

  describe('start and stop', () => {
    it('should start monitoring successfully', async () => {
      mockCoinGeckoService.getTopCryptos.mockResolvedValue([
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          market_cap: 1000000000000,
          market_cap_rank: 1,
          price_change_percentage_24h: 5.2,
          total_volume: 25000000000,
          image: 'bitcoin.png',
        },
      ]);

      await alertMonitor.start();
      const status = alertMonitor.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.monitoredCount).toBeGreaterThan(0);
    });

    it('should stop monitoring successfully', async () => {
      await alertMonitor.start();
      alertMonitor.stop();
      
      const status = alertMonitor.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should not start if already running', async () => {
      await alertMonitor.start();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await alertMonitor.start();
      
      expect(consoleSpy).toHaveBeenCalledWith('Alert monitor is already running');
      consoleSpy.mockRestore();
    });
  });

  describe('addToMonitoring and removeFromMonitoring', () => {
    it('should add cryptocurrency to monitoring', async () => {
      await alertMonitor.addToMonitoring('crypto-1', 'btc', 'bitcoin');
      
      const status = alertMonitor.getStatus();
      expect(status.monitoredCount).toBe(1);
      
      const monitoredCrypto = status.monitoredCryptos.find(c => c.symbol === 'btc');
      expect(monitoredCrypto).toBeDefined();
    });

    it('should remove cryptocurrency from monitoring', async () => {
      await alertMonitor.addToMonitoring('crypto-1', 'btc', 'bitcoin');
      alertMonitor.removeFromMonitoring('crypto-1');
      
      const status = alertMonitor.getStatus();
      expect(status.monitoredCount).toBe(0);
    });
  });

  describe('forceCheck', () => {
    beforeEach(async () => {
      await alertMonitor.addToMonitoring('bitcoin', 'btc', 'bitcoin');
    });

    it('should force check alerts for a cryptocurrency', async () => {
      mockCoinGeckoService.searchCryptos.mockResolvedValue({
        coins: [{ id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', thumb: 'thumb.png' }],
        exchanges: [],
        categories: [],
      });

      mockCoinGeckoService.getCryptoById.mockResolvedValue({
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 50000,
        market_cap: 1000000000000,
        market_cap_rank: 1,
        price_change_percentage_24h: 5.2,
        total_volume: 25000000000,
        image: 'bitcoin.png',
      });

      const result = await alertMonitor.forceCheck('btc');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Alert check completed for btc');
      expect(mockCoinGeckoService.searchCryptos).toHaveBeenCalledWith('btc');
      expect(mockCoinGeckoService.getCryptoById).toHaveBeenCalledWith('bitcoin');
    });

    it('should handle cryptocurrency not found in monitoring', async () => {
      const result = await alertMonitor.forceCheck('unknown');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found in monitoring');
    });

    it('should handle API errors gracefully', async () => {
      mockCoinGeckoService.searchCryptos.mockRejectedValue(new Error('API Error'));

      const result = await alertMonitor.forceCheck('btc');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to force check');
    });
  });

  describe('monitoring loop', () => {
    it('should process market data and check alerts', async () => {
      const mockMarketData = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 55000,
          market_cap: 1100000000000,
          market_cap_rank: 1,
          price_change_percentage_24h: 10.0,
          total_volume: 30000000000,
          image: 'bitcoin.png',
        },
      ];

      mockCoinGeckoService.getTopCryptos.mockResolvedValue(mockMarketData);

      await alertMonitor.addToMonitoring('bitcoin', 'btc', 'bitcoin');
      
      // Access the private monitorLoop method directly for testing
      const monitorLoopMethod = (alertMonitor as any).monitorLoop.bind(alertMonitor);
      
      // Set isRunning to true to enable monitoring
      (alertMonitor as any).isRunning = true;
      
      // Call the monitor loop directly
      await monitorLoopMethod();

      expect(mockCoinGeckoService.getTopCryptos).toHaveBeenCalled();
    });

    it('should handle market data fetch errors', async () => {
      mockCoinGeckoService.getTopCryptos.mockRejectedValue(new Error('Market data error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await alertMonitor.addToMonitoring('bitcoin', 'btc', 'bitcoin');
      
      // Access the private monitorLoop method directly for testing
      const monitorLoopMethod = (alertMonitor as any).monitorLoop.bind(alertMonitor);
      
      // Set isRunning to true to enable monitoring
      (alertMonitor as any).isRunning = true;
      
      // Call the monitor loop directly
      await monitorLoopMethod();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching market data for alert monitoring:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getStatus', () => {
    it('should return correct monitoring status', () => {
      const status = alertMonitor.getStatus();

      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('monitoredCount');
      expect(status).toHaveProperty('lastUpdate');
      expect(status).toHaveProperty('monitoredCryptos');
      
      expect(typeof status.isRunning).toBe('boolean');
      expect(typeof status.monitoredCount).toBe('number');
      expect(Array.isArray(status.monitoredCryptos)).toBe(true);
    });

    it('should show correct status after adding cryptocurrencies', async () => {
      await alertMonitor.addToMonitoring('crypto-1', 'btc');
      await alertMonitor.addToMonitoring('crypto-2', 'eth');

      const status = alertMonitor.getStatus();

      expect(status.monitoredCount).toBe(2);
      expect(status.monitoredCryptos).toHaveLength(2);
      
      const symbols = status.monitoredCryptos.map(c => c.symbol);
      expect(symbols).toContain('btc');
      expect(symbols).toContain('eth');
    });
  });
});