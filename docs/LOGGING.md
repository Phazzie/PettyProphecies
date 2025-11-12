# Logging & Monitoring Guide

This document describes the logging and monitoring setup for the Petty Prophecies application.

## Overview

The application uses:
- **Pino** for structured JSON logging
- **Sentry** for error monitoring and performance tracking
- **Mongoose logger** for database query monitoring

## Structured Logging (Pino)

### Log Levels

| Level | Usage | Examples |
|-------|-------|----------|
| `debug` | Detailed info for debugging | Database queries, API calls |
| `info` | General informational messages | Successful operations, connections |
| `warn` | Warning messages | Slow queries, missing config, deprecated features |
| `error` | Error messages | Failed operations, exceptions |

### Usage Examples

```typescript
import logger from '@/src/utils/logger'

// Basic logging
logger.info('User logged in')
logger.error('Failed to save reading')
logger.warn('Slow query detected')
logger.debug('Cache hit for user data')

// Structured logging with context
logger.info('User logged in', { userId: '123', ip: '127.0.0.1' })
logger.error('Failed to save', { error, userId: '123', operation: 'create' })
logger.warn('Slow query', { duration: 250, collection: 'readings' })
```

### Helper Functions

The logger provides several helper functions for common patterns:

```typescript
import { logRequest, logError, logAuth, logDatabase } from '@/src/utils/logger'

// Log HTTP requests
logRequest(req, userId, duration)

// Log errors with context
logError(error, { userId, operation: 'create-reading' })

// Log authentication events
logAuth('login', userId, true)  // success
logAuth('login', userId, false, 'Invalid password')  // failure

// Log database operations
logDatabase('find', 'readings', duration, true)
```

### Environment Configuration

Configure logging via environment variables:

```bash
# Set log level (default: 'info' in production, 'debug' in development)
LOG_LEVEL=debug  # Options: debug, info, warn, error

# Logs are automatically disabled in test environment
NODE_ENV=test
```

### Output Format

**Development**: Pretty-printed, colorized output with timestamps
```
[2025-11-11 10:30:45] INFO: User logged in
    userId: "123"
    ip: "127.0.0.1"
```

**Production**: Structured JSON for log aggregation
```json
{
  "level": "info",
  "time": 1699704645000,
  "msg": "User logged in",
  "userId": "123",
  "ip": "127.0.0.1"
}
```

### Sensitive Data Redaction

The logger automatically redacts sensitive fields:
- `password`
- `token`
- `authorization`
- `cookie`
- `req.headers.authorization`
- `req.headers.cookie`

These fields are completely removed from logs to prevent credential leakage.

## Error Monitoring (Sentry)

### Setup

Sentry is configured in three files:
- `sentry.client.config.ts` - Client-side (browser) monitoring
- `sentry.server.config.ts` - Server-side (API) monitoring
- `sentry.edge.config.ts` - Edge runtime monitoring

### Configuration

```bash
# Required for Sentry
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Optional: For source map uploading
SENTRY_AUTH_TOKEN=xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### Dashboard Access

Visit: https://sentry.io/organizations/your-org/issues/

Filter by:
- **Environment**: production, staging, development
- **Error type**: ValidationError, AuthenticationError, etc.
- **User**: Authenticated user ID or 'anonymous'
- **Endpoint**: API route where error occurred

### Error Context

All errors sent to Sentry include:
- **User ID**: If authenticated, otherwise 'anonymous'
- **Request URL and method**: `/api/tarot-reading`, `POST`
- **Error stack trace**: Full stack trace for debugging
- **Environment**: production, staging, development
- **Tags**: Custom tags like `endpoint`, `method`, `errorCode`

### Session Replay

Sentry captures session replays for:
- **10% of all sessions** (random sampling)
- **100% of sessions with errors** (for debugging)

Session replays:
- Mask all text content (privacy)
- Block all media (images, videos)
- Show user interactions (clicks, navigation)
- Help debug UI issues

### Sensitive Data Filtering

Sentry automatically filters:
- **Passwords**: All password fields redacted
- **Tokens**: JWT tokens, API keys redacted
- **Cookies**: All cookies removed
- **Authorization headers**: Auth headers removed
- **CSRF tokens**: X-CSRF-Token header removed

### Ignored Errors

Sentry ignores common, expected errors:
- `ResizeObserver loop limit exceeded` (browser quirk)
- `Non-Error promise rejection captured` (handled rejections)
- CSRF validation errors (user errors, not bugs)
- Rate limit errors (expected behavior)

### Error Handling Flow

```
Error occurs → Logged via Pino → Sent to Sentry (if unexpected) → User receives friendly message
```

**Expected user errors** (ValidationError, AuthenticationError):
- Logged at `warn` level
- NOT sent to Sentry
- User sees helpful message

**Unexpected system errors** (database errors, API failures):
- Logged at `error` level
- Sent to Sentry with context
- User sees generic error message

## Database Query Monitoring

### Mongoose Logger

The mongoose logger monitors database queries and logs slow operations.

```typescript
import { enableQueryMonitoring } from '@/src/utils/mongooseLogger'

// Enable query monitoring (called automatically in connectToDatabase)
enableQueryMonitoring()
```

### Configuration

```bash
# Enable query monitoring in non-production environments
ENABLE_QUERY_MONITORING=true

# In production, only slow queries (>100ms) are logged
NODE_ENV=production
```

### Slow Query Detection

Queries taking longer than **100ms** are logged as warnings:

```json
{
  "level": "warn",
  "type": "slow_query",
  "collection": "readings",
  "method": "find",
  "duration": 250
}
```

### Query Optimization

If you see slow query warnings:

1. **Check indexes**: Ensure proper indexes exist
   ```bash
   npm run verify:indexes
   ```

2. **Review query patterns**: Look for N+1 queries or missing filters

3. **Add indexes**: Update models with appropriate indexes
   ```typescript
   UserSchema.index({ email: 1 })
   ReadingSchema.index({ userId: 1, createdAt: -1 })
   ```

4. **Use explain()**: Analyze query execution
   ```typescript
   await User.find({ email }).explain()
   ```

## Best Practices

### 1. Use Structured Logging

**Bad**:
```typescript
logger.info(`User ${userId} logged in from ${ip}`)
```

**Good**:
```typescript
logger.info('User logged in', { userId, ip })
```

### 2. Include Context

**Bad**:
```typescript
logger.error('Save failed')
```

**Good**:
```typescript
logger.error('Save failed', {
  error,
  userId,
  operation: 'create-reading',
  cardCount: cards.length
})
```

### 3. Choose Appropriate Log Levels

- Use `debug` for verbose development info
- Use `info` for normal operations
- Use `warn` for concerning but non-critical issues
- Use `error` for actual errors requiring attention

### 4. Don't Log Sensitive Data

**Bad**:
```typescript
logger.info('User authenticated', { email, password })
```

**Good**:
```typescript
logger.info('User authenticated', { userId, email })
// Note: password is auto-redacted if accidentally included
```

### 5. Log Performance Metrics

```typescript
const start = Date.now()
await performOperation()
const duration = Date.now() - start

logger.info('Operation completed', { operation: 'tarot-reading', duration })
```

## Monitoring Checklist

### Daily
- [ ] Check Sentry for new errors
- [ ] Review error rate trends
- [ ] Check for repeated issues

### Weekly
- [ ] Review slow query logs
- [ ] Check database performance
- [ ] Analyze user error patterns

### Monthly
- [ ] Review log retention policies
- [ ] Update alerting rules
- [ ] Audit Sentry quotas

## Troubleshooting

### Logs Not Appearing

**Problem**: Logs not visible in development

**Solution**:
1. Check `LOG_LEVEL` environment variable
2. Ensure `NODE_ENV` is not set to `test`
3. Verify pino-pretty is installed: `npm ls pino-pretty`

### Sentry Not Capturing Errors

**Problem**: Errors not appearing in Sentry dashboard

**Solution**:
1. Check `SENTRY_DSN` is set correctly
2. Verify error is not in `ignoreErrors` list
3. Check error is not an expected user error (ValidationError, etc.)
4. Verify network connectivity to Sentry

### Slow Queries Not Logged

**Problem**: Known slow queries not appearing in logs

**Solution**:
1. Ensure `enableQueryMonitoring()` is called
2. Check if query actually takes >100ms
3. Verify `LOG_LEVEL` includes `warn` level
4. In non-production, set `ENABLE_QUERY_MONITORING=true`

## Integration with Other Services

### Vercel Logs

In production on Vercel:
- Logs appear in Vercel dashboard
- JSON format enables log filtering
- Real-time log streaming available

### Log Aggregation

For production log aggregation, consider:
- **Datadog**: Full observability platform
- **Logtail**: Simple JSON log management
- **Papertrail**: Log aggregation and search
- **Logflare**: Vercel-native logging

To integrate, consume JSON logs from stdout.

## References

- [Pino Documentation](https://getpino.io/)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Mongoose Debug Mode](https://mongoosejs.com/docs/api/mongoose.html#mongoose_Mongoose-set)

## Support

For questions or issues:
1. Check this documentation
2. Review error logs in Sentry
3. Search application logs for context
4. Contact the development team
