# Redis Cache Setup for CryptoSentiment

This document explains how to set up and configure Redis cache for bot verification codes in the CryptoSentiment application.

## Overview

Redis is used to store verification codes for Discord and Telegram bot account linking. This ensures that verification codes:
- Persist across application deployments and restarts
- Automatically expire after 5 minutes for security
- Are accessible across multiple server instances in production

## Local Development Setup

### Option 1: Using Docker (Recommended)

1. **Install Docker** if you haven't already:
   - Visit [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

2. **Run Redis container**:
   ```bash
   docker run -d -p 6379:6379 --name redis-cryptosentiment redis:7-alpine
   ```

3. **Verify Redis is running**:
   ```bash
   docker ps | grep redis
   ```

### Option 2: Local Installation

#### macOS (using Homebrew)
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

#### Windows
Download and install from [Redis Windows releases](https://github.com/microsoftarchive/redis/releases)

### Environment Configuration

Add to your `.env.local` file:
```env
REDIS_URL="redis://localhost:6379"
```

For production environments, use your Redis provider's URL:
```env
REDIS_URL="redis://username:password@your-redis-host:6379"
```

## Production Setup

### Railway (Recommended for CryptoSentiment)

1. **Add Redis Plugin**:
   - Go to your Railway project dashboard
   - Click "New" → "Database" → "Add Redis"
   - Railway will automatically provision a Redis instance

2. **Environment Variable**:
   - Railway automatically sets `REDIS_URL` for you
   - No manual configuration needed

### Other Cloud Providers

#### Upstash (Serverless Redis)
1. Create account at [upstash.com](https://upstash.com)
2. Create new Redis database
3. Copy the Redis URL
4. Add to your environment variables

#### Redis Cloud
1. Create account at [redis.com/cloud](https://redis.com/cloud)
2. Create new subscription
3. Get connection URL from database details
4. Add to your environment variables

#### AWS ElastiCache
1. Create Redis cluster in AWS ElastiCache
2. Configure security groups for access
3. Use the connection endpoint as REDIS_URL

## Verification Code Storage

### How It Works

1. **Code Generation**: When a user initiates bot linking, a verification code is generated and stored in Redis
2. **Storage Key Format**: `bot_verification:{userId}:{botType}`
   - Example: `bot_verification:user-123:discord`
3. **Expiration**: Codes automatically expire after 5 minutes (300 seconds)
4. **Verification**: When the user submits the code, it's checked against Redis
5. **Cleanup**: Successful verification deletes the code from Redis

### Code Example

```typescript
// Store verification code
await setVerificationCode(userId, 'discord', 'ABC12345', 300);

// Retrieve verification code
const code = await getVerificationCode(userId, 'discord');

// Delete verification code after use
await deleteVerificationCode(userId, 'discord');
```

## Testing

### Unit Tests
Redis is mocked in unit tests. No real Redis instance needed:
```bash
npm test -- redis.test.ts
```

### Integration Testing
For integration tests with real Redis:
```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Set environment variable
export REDIS_URL="redis://localhost:6379"

# Run tests
npm test
```

## Monitoring

### Check Redis Connection Status

The application logs Redis connection events:
- ✅ `Redis client connected successfully` - Connection established
- ⚠️ `REDIS_URL not configured. Redis cache disabled.` - Missing configuration
- ❌ `Redis client error: ...` - Connection or operation error

### Redis CLI Commands

Connect to Redis and inspect data:
```bash
# Connect to Redis
redis-cli

# List all verification codes
KEYS bot_verification:*

# Get specific verification code
GET bot_verification:user-123:discord

# Check TTL (time to live) of a code
TTL bot_verification:user-123:discord

# Manually delete a code (for testing)
DEL bot_verification:user-123:discord
```

### Health Check

```typescript
import { isRedisAvailable } from '@/lib/cache/redis';

if (isRedisAvailable()) {
  console.log('Redis is connected and ready');
} else {
  console.log('Redis is not available');
}
```

## Troubleshooting

### "REDIS_URL not configured" Warning

**Solution**: Add `REDIS_URL` to your environment variables
```bash
export REDIS_URL="redis://localhost:6379"
```

### Connection Refused Error

**Solution**: Verify Redis is running
```bash
# Docker
docker ps | grep redis

# Local installation
redis-cli ping
# Should return: PONG
```

### Code Not Found or Expired

This is expected behavior:
- Verification codes expire after 5 minutes
- Codes are deleted after successful verification
- User should generate a new code

### Multiple Server Instances

Redis ensures verification codes work across multiple app instances:
- Code stored by Instance A can be verified by Instance B
- No code duplication issues
- Consistent expiration across instances

## Graceful Degradation

The application handles Redis unavailability gracefully:

1. **Redis Unavailable**: Verification codes won't be stored, but the app continues to function
2. **Fallback**: Manual verification or alternative linking methods should be used
3. **Logs**: Warning messages indicate Redis issues without crashing the app

## Security Considerations

1. **Code Expiration**: 5-minute TTL prevents replay attacks
2. **One-Time Use**: Codes are deleted after successful verification
3. **User-Specific**: Codes are tied to specific user IDs
4. **Bot-Specific**: Discord and Telegram codes are separate
5. **Secure Connection**: Use TLS for production Redis connections

## Performance

- **Key Format**: Simple string keys for fast lookup
- **Memory Usage**: ~100 bytes per verification code
- **Typical Load**: 1-10 codes stored simultaneously
- **Expiration**: Automatic cleanup via Redis TTL

## Migration Notes

### From In-Memory Storage

The previous implementation used in-memory storage (commented TODOs in `bots.ts`). Redis provides:
- ✅ Persistence across restarts
- ✅ Distributed cache for multiple instances
- ✅ Automatic expiration
- ✅ Production reliability

No data migration needed as verification codes are temporary by nature.

## Support

For issues or questions:
1. Check application logs for Redis connection messages
2. Verify REDIS_URL is correctly set
3. Test Redis connection with `redis-cli ping`
4. Review this documentation
5. Check Redis provider status pages
