# Redis Setup Guide

## Upstash Redis Configuration

### 1. Create Upstash Account
1. Go to https://upstash.com
2. Sign up (free tier available)
3. Create new database
4. Select region closest to Vercel deployment (US East recommended)

### 2. Get Credentials
After creating database, copy:
- REST URL: `https://your-db.upstash.io`
- REST Token: `your-token-here`

### 3. Add to Environment Variables

**Local development (.env.local):**
```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**Vercel deployment:**
```bash
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
```

### 4. Test Connection
```bash
curl https://your-db.upstash.io/get/test \
  -H "Authorization: Bearer your-token"
```

## Rate Limit Configuration

Current limits (src/middleware/rateLimit.v2.ts):

### Authentication Endpoints
- **auth:login** - 5 requests per 15 minutes
- **auth:register** - 3 requests per hour
- **auth:password-reset** - 3 requests per hour
- **auth:verify** - 60 requests per minute (for session checks)
- **auth:logout** - 10 requests per minute

### Application Endpoints
- **tarot:reading** - 10 requests per minute
- **api:general** - 100 requests per minute

### Legacy Actions (backward compatibility)
- **auth** - 10 requests per 15 minutes
- **reading** - 20 requests per 15 minutes
- **general** - 50 requests per 15 minutes
- **api** - 50 requests per 15 minutes

## Fallback Behavior

If Redis is unavailable, the system automatically falls back to in-memory rate limiting with a warning logged.

**Fallback scenarios:**
- Redis credentials not configured
- Redis connection fails
- Upstash service unavailable
- Network issues

**Warning message:**
```
Upstash Redis credentials not found. Using in-memory rate limiter.
```

## Architecture

### Rate Limiter Service
The rate limiter implements the `IRateLimiter` interface defined in `src/interfaces/seams.ts`.

**Key features:**
- Sliding window algorithm
- Distributed rate limiting via Redis
- Automatic fallback to in-memory
- Per-action rate limits
- X-RateLimit-* headers

### Usage in API Endpoints

```typescript
import { getRateLimiter, RateLimitError, setRateLimitHeaders } from '@/src/middleware/rateLimit.v2'

const rateLimiter = getRateLimiter()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get identifier (IP address or user ID)
  const identifier = (req.headers['x-forwarded-for'] as string) ||
                     req.socket.remoteAddress ||
                     'unknown'

  // Check rate limit
  const result = await rateLimiter.checkLimit(identifier, 'auth:login')

  // Set response headers
  setRateLimitHeaders(res, result)

  // Check if rate limited
  if (!result.allowed) {
    throw new RateLimitError(
      `Too many requests. Try again in ${Math.ceil(result.retryAfter! / 60)} minutes.`,
      result.retryAfter
    )
  }

  // ... rest of handler logic
}
```

## Monitoring

### Rate Limit Headers
All rate-limited endpoints return these headers:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in window
- `X-RateLimit-Reset` - ISO timestamp when window resets
- `Retry-After` - Seconds until retry (only when rate limited)

### Error Response
When rate limited, endpoints return:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in X minutes."
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

## Upstash Console

Monitor rate limiting in Upstash console:
1. Login to https://console.upstash.com
2. Select your database
3. View metrics:
   - Total requests
   - Request rate
   - Storage usage
   - Regional distribution

## Troubleshooting

### Issue: Rate limiter not using Redis
**Check:**
- Environment variables are set correctly
- Redis URL is accessible
- REST token is valid
- No firewall blocking Upstash

**Solution:**
```bash
# Test connection
curl https://your-db.upstash.io/ping \
  -H "Authorization: Bearer your-token"

# Should return: {"result":"PONG"}
```

### Issue: Rate limits too strict in development
**Temporary solution:**
```typescript
// In rateLimit.v2.ts, increase limits for development
const isDevelopment = process.env.NODE_ENV === 'development'

const RATE_LIMITS: Record<RateLimitAction, { limit: number; windowMs: number }> = {
  'auth:login': {
    limit: isDevelopment ? 100 : 5,
    windowMs: 15 * 60 * 1000,
  },
  // ... rest of limits
}
```

### Issue: Redis connection errors
**Check logs for:**
- `Failed to initialize Redis rate limiter`
- `Redis rate limiter error, falling back to in-memory`

**Action:** System will continue working with in-memory fallback, but rate limits won't be shared across instances.

## Production Checklist

- [ ] Upstash Redis database created
- [ ] Region selected (closest to Vercel deployment)
- [ ] Environment variables added to Vercel
- [ ] Connection tested successfully
- [ ] Rate limits reviewed and approved
- [ ] Monitoring dashboard configured
- [ ] Alerts set up for high rate limit hits
- [ ] Documentation reviewed by team

## Additional Resources

- [Upstash Documentation](https://upstash.com/docs)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
