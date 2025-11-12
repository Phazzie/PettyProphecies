# Production Deployment Guide - Petty Prophecies

**Version:** 2.0.0
**Date:** 2025-11-11
**Status:** Ready for Production (93% complete)

---

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration

#### Required Environment Variables

```bash
# Production .env file

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/petty-prophecies?retryWrites=true&w=majority

# Authentication (CRITICAL - Generate a strong secret!)
JWT_SECRET=$(openssl rand -base64 32)

# Email Service (Sign up at https://resend.com)
RESEND_API_KEY=re_your_production_key_here
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Rate Limiting (Sign up at https://upstash.com)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Optional - AI Readings
XAI_API_KEY=your-xai-key  # Only if you want AI readings

# Optional - Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Environment
NODE_ENV=production
LOG_LEVEL=info
```

#### Generate Secrets

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Example output: 8Ky4fQzV2qW3xN5mP9rT0uY7iO6pA1sD3fG8hJ2kL4nM
```

---

### 2. External Service Setup

#### A. MongoDB Atlas (Database)

1. **Create Cluster**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create free M0 cluster (or paid for production scale)
   - Choose region closest to your users

2. **Configure Network Access**
   - Add IP whitelist: `0.0.0.0/0` (for Vercel/serverless)
   - Or add specific Vercel IP ranges

3. **Create Database User**
   - Username: `petty_app`
   - Password: Strong, random (save it!)
   - Permissions: Read/Write to database

4. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy URI: `mongodb+srv://petty_app:<password>@cluster0.xxxxx.mongodb.net/petty-prophecies`

5. **Create Indexes** (CRITICAL for performance)

```bash
# Connect to MongoDB
mongosh "your-connection-string-here"

# User indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })

# Reading indexes
db.readings.createIndex({ userId: 1 })
db.readings.createIndex({ createdAt: -1 })
db.readings.createIndex({ userId: 1, createdAt: -1 })

# PasswordReset indexes
db.passwordresets.createIndex({ token: 1 }, { unique: true })
db.passwordresets.createIndex({ userId: 1 })
db.passwordresets.createIndex({ expiresAt: 1 })
db.passwordresets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.passwordresets.createIndex({ userId: 1, expiresAt: 1 })

# Verify indexes
db.users.getIndexes()
db.readings.getIndexes()
db.passwordresets.getIndexes()
```

#### B. Resend (Email Service)

1. **Sign Up**
   - Go to [resend.com](https://resend.com)
   - Free tier: 100 emails/day

2. **Verify Domain** (Recommended for production)
   - Add DNS records to your domain
   - Update `from` address in `src/services/email.ts` to use your domain

3. **Get API Key**
   - Dashboard → API Keys → Create
   - Copy key (starts with `re_`)
   - Add to environment: `RESEND_API_KEY=re_...`

4. **Test Email**
```bash
# After deployment, test:
curl -X POST https://yourdomain.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

#### C. Upstash Redis (Rate Limiting)

1. **Sign Up**
   - Go to [upstash.com](https://upstash.com)
   - Free tier: 10,000 requests/day

2. **Create Database**
   - Click "Create Database"
   - Choose region closest to your deployment
   - Enable TLS

3. **Get Credentials**
   - Copy `UPSTASH_REDIS_REST_URL`
   - Copy `UPSTASH_REDIS_REST_TOKEN`
   - Add to environment variables

#### D. xAI (Optional - AI Readings)

1. **Sign Up**
   - Go to [x.ai](https://x.ai)
   - Apply for API access

2. **Get API Key**
   - Dashboard → API Keys
   - Add to environment: `XAI_API_KEY=your-key`

3. **Monitor Usage**
   - Track costs in xAI dashboard
   - ~$0.01-0.02 per reading
   - Consider making AI readings premium-only

#### E. Sentry (Optional - Error Tracking)

1. **Sign Up**
   - Go to [sentry.io](https://sentry.io)
   - Free tier: 5,000 errors/month

2. **Create Project**
   - Choose "Next.js" platform
   - Copy DSN
   - Add to environment: `NEXT_PUBLIC_SENTRY_DSN=...`

---

### 3. Code Migration

#### A. Update API Endpoints (Critical)

**Priority 1: Authentication Endpoints**

Update `/api/auth/login`:
```typescript
import { getAuthService } from '@/src/middleware/auth.v2'
import { validateRequest } from '@/src/middleware/validateRequest'
import { sendSuccess, sendError } from '@/src/utils/apiResponse'
import { errorHandler } from '@/src/middleware/errorHandler.v2'

const authService = getAuthService()

export default validateRequest("login", async (req, res) => {
  try {
    const { email, password } = req.validatedData

    // Your existing login logic
    const user = await authenticateUser(email, password)

    // NEW: Set httpOnly cookie (no more token in response body!)
    await authService.setAuthCookie(res, user._id.toString())

    // NEW: Standardized response
    return sendSuccess(res, {
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email }
    })
  } catch (error) {
    return errorHandler(error, req, res)
  }
})
```

Update `/api/auth/logout`:
```typescript
import { getAuthService } from '@/src/middleware/auth.v2'
import { sendSuccess } from '@/src/utils/apiResponse'

const authService = getAuthService()

export default async (req, res) => {
  authService.clearAuthCookie(res)
  return sendSuccess(res, { message: "Logged out successfully" })
}
```

Update `/api/auth/register`:
```typescript
import { validateRequest } from '@/src/middleware/validateRequest'
import { getAuthService } from '@/src/middleware/auth.v2'
import { UserRepository } from '@/src/repositories/UserRepository'
import { emailService } from '@/src/services/email'
import { sendSuccess } from '@/src/utils/apiResponse'
import { errorHandler } from '@/src/middleware/errorHandler.v2'

const authService = getAuthService()
const userRepo = new UserRepository()

export default validateRequest("register", async (req, res) => {
  try {
    const { username, email, password } = req.validatedData

    // Create user using repository
    const user = await userRepo.create({ username, email, password })

    // Set auth cookie
    await authService.setAuthCookie(res, user._id.toString())

    // Send welcome email (async, don't wait)
    emailService.sendWelcome(email, username).catch(console.error)

    return sendSuccess(res, {
      message: "Registration successful",
      user: { id: user._id, username: user.username, email: user.email }
    }, 201)
  } catch (error) {
    return errorHandler(error, req, res)
  }
})
```

**Priority 2: Protected Endpoints**

Update `/api/tarot-reading`:
```typescript
import { getAuthService } from '@/src/middleware/auth.v2'
import { validateRequest } from '@/src/middleware/validateRequest'
import { getRateLimiter } from '@/src/middleware/rateLimit.v2'
import { errorHandler } from '@/src/middleware/errorHandler.v2'
import { sendSuccess } from '@/src/utils/apiResponse'

const authService = getAuthService()
const rateLimiter = getRateLimiter()

export default validateRequest("tarotReading", async (req, res) => {
  try {
    if (req.method === 'POST') {
      // Verify authentication
      const userId = await authService.requireAuth(req)

      // Check rate limit
      const rateLimit = await rateLimiter.checkLimit(userId, 'reading')
      if (!rateLimit.allowed) {
        throw new RateLimitError('Too many readings', rateLimit.resetAt)
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', rateLimit.limit.toString())
      res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString())
      res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString())

      // Your existing logic...
      const { spreadType, userQuestion } = req.validatedData
      const reading = await generateReading(spreadType, userQuestion)

      return sendSuccess(res, reading, 201)
    }

    // ... PUT logic
  } catch (error) {
    return errorHandler(error, req, res)
  }
})
```

#### B. Update Client-Side Code

**Remove localStorage token management:**

OLD (`src/contexts/AuthContext.tsx` or similar):
```typescript
// ❌ OLD - Remove this
localStorage.setItem('token', response.token)
const token = localStorage.getItem('token')
```

NEW:
```typescript
// ✅ NEW - No token storage needed
// Cookies are automatically sent with requests
```

**Update fetch requests:**

OLD:
```typescript
// ❌ OLD
fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

NEW:
```typescript
// ✅ NEW
fetch('/api/protected', {
  credentials: 'include',  // CRITICAL: Send cookies
  headers: {
    'Content-Type': 'application/json'
  }
})
```

**Handle CSRF tokens:**

```typescript
// Get CSRF token on session init
const initSession = async () => {
  const response = await fetch('/api/auth/session', {
    credentials: 'include'
  })
  const csrfToken = response.headers.get('X-CSRF-Token')
  // Store in React state or context
  setCSRFToken(csrfToken)
}

// Use CSRF token in POST/PUT/DELETE requests
const submitData = async (data) => {
  await fetch('/api/endpoint', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken  // Include token
    },
    body: JSON.stringify(data)
  })
}
```

---

### 4. Build and Deploy

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Set environment variables (one-time)
vercel env add MONGODB_URI production
vercel env add JWT_SECRET production
vercel env add RESEND_API_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production

# Deploy to production
vercel --prod
```

#### Docker (Self-Hosted)

```bash
# Build image
docker build -t petty-prophecies:latest .

# Run container
docker run -p 3000:3000 \
  -e MONGODB_URI="your-uri" \
  -e JWT_SECRET="your-secret" \
  -e RESEND_API_KEY="your-key" \
  -e NEXT_PUBLIC_APP_URL="https://yourdomain.com" \
  -e UPSTASH_REDIS_REST_URL="your-url" \
  -e UPSTASH_REDIS_REST_TOKEN="your-token" \
  -e NODE_ENV="production" \
  petty-prophecies:latest

# Or use docker-compose.yml (update with production values)
docker-compose up -d
```

---

### 5. Post-Deployment Verification

#### A. Health Checks

```bash
# 1. Check application is running
curl https://yourdomain.com

# 2. Test authentication
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"SecurePass123!"}'

# 3. Test login (save cookies)
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'

# 4. Test protected endpoint (use cookies)
curl https://yourdomain.com/api/user/readings \
  -b cookies.txt

# 5. Test password reset
curl -X POST https://yourdomain.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### B. Monitor Services

1. **Vercel Dashboard**
   - Check deployment logs
   - Monitor request counts
   - Check function execution times

2. **MongoDB Atlas**
   - Monitor connection count
   - Check query performance
   - Verify indexes are being used

3. **Upstash Dashboard**
   - Monitor rate limit hits
   - Check Redis latency

4. **Resend Dashboard**
   - Check email delivery rate
   - Monitor bounces

5. **Sentry** (if enabled)
   - Check error counts
   - Review stack traces

---

### 6. Security Hardening

#### A. HTTPS Only

Ensure all traffic uses HTTPS:
```typescript
// In middleware or API routes
if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
  return res.redirect(301, `https://${req.headers.host}${req.url}`)
}
```

#### B. Security Headers

Add to `next.config.mjs`:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

#### C. Rate Limit Monitoring

Set up alerts for rate limit violations:
- High rate limit hits = potential attack
- Monitor Upstash dashboard

---

### 7. Performance Optimization

#### A. Enable Caching

```typescript
// In API routes
res.setHeader('Cache-Control', 'private, max-age=300, must-revalidate')
```

#### B. Database Connection Pooling

Already handled in `src/utils/database.ts`, but verify:
- Connection pool size appropriate for load
- Connections close properly

#### C. Monitor Performance

- Use Vercel Analytics
- Monitor API response times
- Check database query performance

---

### 8. Backup Strategy

#### A. Database Backups

MongoDB Atlas:
- Enable automatic backups (included in M10+ clusters)
- Test restore process monthly

Manual backup:
```bash
mongodump --uri="your-connection-string" --out=/backup/$(date +%Y-%m-%d)
```

#### B. Environment Variable Backup

Save `.env` file securely (NOT in git):
```bash
# Encrypt and store
openssl enc -aes-256-cbc -salt -in .env -out .env.encrypted
```

---

### 9. Rollback Plan

If deployment fails:

1. **Vercel**: Use previous deployment
   ```bash
   vercel rollback
   ```

2. **Docker**: Use previous image tag
   ```bash
   docker pull petty-prophecies:v1.0.0
   docker run ...
   ```

3. **Database**: Restore from backup if needed

---

### 10. Monitoring Checklist

Daily:
- [ ] Check error rate in Sentry
- [ ] Check email delivery in Resend
- [ ] Monitor application uptime

Weekly:
- [ ] Review rate limit metrics
- [ ] Check database performance
- [ ] Review security logs

Monthly:
- [ ] Update dependencies (`npm outdated`)
- [ ] Review and rotate secrets
- [ ] Test backup restore

---

## 🚨 Known Issues (35 failing tests)

Before production deployment, fix these:

### Issue 1: PasswordReset Model Tests (7 tests)
**Fix:** Add MongoDB memory server to jest config
```bash
npm install --save-dev mongodb-memory-server
```

### Issue 2: ForgotPassword Component (12 tests)
**Fix:** Add accessibility attributes
```typescript
<input
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && <div id="email-error" role="alert">{error}</div>}
```

### Issue 3: ResetPassword Component (13 tests)
**Fix:** Same as ForgotPassword

### Issue 4: TarotReading Component (3 tests)
**Fix:** Adjust test selectors for loading states

---

## 📞 Support

**Documentation:**
- API Reference: `/docs/API.md`
- Migration Guide: `/docs/MIGRATION_GUIDE.md`
- Database Indexes: `/docs/DATABASE_INDEXES.md`

**External Services:**
- MongoDB: https://docs.mongodb.com
- Resend: https://resend.com/docs
- Upstash: https://docs.upstash.com
- Vercel: https://vercel.com/docs

---

## ✅ Final Checklist Before Going Live

- [ ] All environment variables set in production
- [ ] Database indexes created
- [ ] Email service configured and tested
- [ ] Rate limiter configured (Upstash)
- [ ] All 503 tests passing (fix 35 failing tests)
- [ ] API endpoints migrated to new middleware
- [ ] Client code updated (cookies, CSRF)
- [ ] Security headers configured
- [ ] Monitoring set up (Sentry)
- [ ] Backup strategy in place
- [ ] Domain configured with SSL
- [ ] Test complete user flow (register → login → reading → password reset)

---

**Ready to deploy?** Follow this guide step-by-step. Good luck! 🚀
