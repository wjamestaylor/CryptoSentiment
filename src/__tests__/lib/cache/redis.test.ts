import {
  setVerificationCode,
  getVerificationCode,
  deleteVerificationCode,
  closeRedisConnection,
  isRedisAvailable,
} from '@/lib/cache/redis';

// Mock ioredis
jest.mock('ioredis', () => {
  const mockRedis = {
    setex: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    status: 'ready',
  };

  return jest.fn(() => mockRedis);
});

describe('Redis Cache Service', () => {
  let Redis: jest.Mock;
  let mockRedisInstance: {
    setex: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
    quit: jest.Mock;
    on: jest.Mock;
    status: string;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked Redis constructor
    Redis = require('ioredis');
    mockRedisInstance = Redis() as typeof mockRedisInstance;
    
    // Reset environment (using Object.defineProperty for read-only properties)
    process.env.REDIS_URL = 'redis://localhost:6379';
    Object.defineProperty(process.env, 'NODE_ENV', { 
      value: 'production', 
      writable: true,
      configurable: true
    });
  });

  afterEach(async () => {
    // Clean up Redis connection after each test
    await closeRedisConnection();
    delete process.env.REDIS_URL;
  });

  describe('setVerificationCode', () => {
    it('should store verification code in Redis with default expiration', async () => {
      const result = await setVerificationCode('user-123', 'discord', 'ABC12345');

      expect(result).toBe(true);
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'bot_verification:user-123:discord',
        300,
        'ABC12345'
      );
    });

    it('should store verification code with custom expiration', async () => {
      const result = await setVerificationCode('user-123', 'telegram', 'XYZ98765', 600);

      expect(result).toBe(true);
      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'bot_verification:user-123:telegram',
        600,
        'XYZ98765'
      );
    });

    it('should return false when Redis is not available', async () => {
      delete process.env.REDIS_URL;
      
      const result = await setVerificationCode('user-123', 'discord', 'ABC12345');

      expect(result).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.setex.mockRejectedValueOnce(new Error('Redis error'));

      const result = await setVerificationCode('user-123', 'discord', 'ABC12345');

      expect(result).toBe(false);
    });
  });

  describe('getVerificationCode', () => {
    it('should retrieve verification code from Redis', async () => {
      mockRedisInstance.get.mockResolvedValueOnce('ABC12345');

      const result = await getVerificationCode('user-123', 'discord');

      expect(result).toBe('ABC12345');
      expect(mockRedisInstance.get).toHaveBeenCalledWith(
        'bot_verification:user-123:discord'
      );
    });

    it('should return null when code does not exist', async () => {
      mockRedisInstance.get.mockResolvedValueOnce(null);

      const result = await getVerificationCode('user-123', 'discord');

      expect(result).toBeNull();
    });

    it('should return null when Redis is not available', async () => {
      delete process.env.REDIS_URL;

      const result = await getVerificationCode('user-123', 'discord');

      expect(result).toBeNull();
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await getVerificationCode('user-123', 'discord');

      expect(result).toBeNull();
    });
  });

  describe('deleteVerificationCode', () => {
    it('should delete verification code from Redis', async () => {
      const result = await deleteVerificationCode('user-123', 'discord');

      expect(result).toBe(true);
      expect(mockRedisInstance.del).toHaveBeenCalledWith(
        'bot_verification:user-123:discord'
      );
    });

    it('should return false when Redis is not available', async () => {
      delete process.env.REDIS_URL;

      const result = await deleteVerificationCode('user-123', 'discord');

      expect(result).toBe(false);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisInstance.del.mockRejectedValueOnce(new Error('Redis error'));

      const result = await deleteVerificationCode('user-123', 'discord');

      expect(result).toBe(false);
    });
  });

  describe('closeRedisConnection', () => {
    it('should close Redis connection', async () => {
      // First, create a connection by calling a function
      await setVerificationCode('user-123', 'discord', 'ABC12345');

      await closeRedisConnection();

      expect(mockRedisInstance.quit).toHaveBeenCalled();
    });

    it('should handle multiple close calls gracefully', async () => {
      await closeRedisConnection();
      await closeRedisConnection();

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('isRedisAvailable', () => {
    it('should return true when Redis is connected', async () => {
      // Initialize Redis by calling a function
      await setVerificationCode('user-123', 'discord', 'ABC12345');

      const available = isRedisAvailable();

      expect(available).toBe(true);
    });

    it('should return false when Redis is not initialized', () => {
      const available = isRedisAvailable();

      expect(available).toBe(false);
    });
  });

  describe('Environment Configuration', () => {
    it('should skip Redis in test environment', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { 
        value: 'test', 
        writable: true,
        configurable: true
      });

      const result = await setVerificationCode('user-123', 'discord', 'ABC12345');

      expect(result).toBe(false);
      
      Object.defineProperty(process.env, 'NODE_ENV', { 
        value: originalNodeEnv, 
        writable: true,
        configurable: true
      });
    });

    it('should warn when REDIS_URL is not configured', async () => {
      delete process.env.REDIS_URL;
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await setVerificationCode('user-123', 'discord', 'ABC12345');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Redis not available, verification code not cached'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Redis Event Handlers', () => {
    it('should set up connection event handlers', async () => {
      // Initialize Redis
      await setVerificationCode('user-123', 'discord', 'ABC12345');

      expect(mockRedisInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('close', expect.any(Function));
    });
  });

  describe('Key Format', () => {
    it('should generate correct key format for Discord', async () => {
      await setVerificationCode('user-abc', 'discord', 'CODE123');

      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'bot_verification:user-abc:discord',
        expect.any(Number),
        'CODE123'
      );
    });

    it('should generate correct key format for Telegram', async () => {
      await setVerificationCode('user-xyz', 'telegram', 'CODE456');

      expect(mockRedisInstance.setex).toHaveBeenCalledWith(
        'bot_verification:user-xyz:telegram',
        expect.any(Number),
        'CODE456'
      );
    });
  });
});
