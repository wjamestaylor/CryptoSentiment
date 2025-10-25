import Redis from 'ioredis';

/**
 * Redis Cache Service for CryptoSentiment
 * Provides centralized Redis client management with proper error handling
 * Used for verification codes, rate limiting, and other cache needs
 */

// Redis client instance
let redisClient: Redis | null = null;

/**
 * Initialize Redis client with connection retry logic
 */
function getRedisClient(): Redis | null {
  // Return existing client if available
  if (redisClient) {
    return redisClient;
  }

  // Skip Redis in test environment
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  // Skip Redis if URL not configured
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not configured. Redis cache disabled.');
    return null;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        // Only reconnect when the error contains "READONLY"
        if (err.message.includes('READONLY')) {
          return true;
        }
        return false;
      },
    });

    // Handle connection events
    redisClient.on('connect', () => {
      console.log('Redis client connected successfully');
    });

    redisClient.on('error', (error) => {
      console.error('Redis client error:', error);
    });

    redisClient.on('close', () => {
      console.warn('Redis client connection closed');
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return null;
  }
}

/**
 * Store a verification code in Redis with expiration
 * @param userId - The user ID
 * @param botType - The bot type (discord or telegram)
 * @param code - The verification code
 * @param expirationSeconds - Time to live in seconds (default: 300 = 5 minutes)
 */
export async function setVerificationCode(
  userId: string,
  botType: 'discord' | 'telegram',
  code: string,
  expirationSeconds = 300
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    console.warn('Redis not available, verification code not cached');
    return false;
  }

  try {
    const key = `bot_verification:${userId}:${botType}`;
    await client.setex(key, expirationSeconds, code);
    return true;
  } catch (error) {
    console.error('Failed to set verification code in Redis:', error);
    return false;
  }
}

/**
 * Retrieve a verification code from Redis
 * @param userId - The user ID
 * @param botType - The bot type (discord or telegram)
 * @returns The verification code or null if not found/expired
 */
export async function getVerificationCode(
  userId: string,
  botType: 'discord' | 'telegram'
): Promise<string | null> {
  const client = getRedisClient();
  if (!client) {
    console.warn('Redis not available, cannot retrieve verification code');
    return null;
  }

  try {
    const key = `bot_verification:${userId}:${botType}`;
    const code = await client.get(key);
    return code;
  } catch (error) {
    console.error('Failed to get verification code from Redis:', error);
    return null;
  }
}

/**
 * Delete a verification code from Redis
 * @param userId - The user ID
 * @param botType - The bot type (discord or telegram)
 */
export async function deleteVerificationCode(
  userId: string,
  botType: 'discord' | 'telegram'
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    console.warn('Redis not available, cannot delete verification code');
    return false;
  }

  try {
    const key = `bot_verification:${userId}:${botType}`;
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Failed to delete verification code from Redis:', error);
    return false;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
}

/**
 * Check if Redis is available and connected
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null && redisClient.status === 'ready';
}
