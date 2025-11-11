# 🚀 Production Deployment Plan - To Vercel

**Date:** 2025-11-11
**Current Status:** 🟡 **Phase 1 Complete - Ready for Infrastructure & Deployment**
**Target:** **Vercel Production Deployment**
**Estimated Time:** **12-18 hours** (with parallel execution)

---

## Executive Summary

**Completed:**
- ✅ Phase 0: Emergency fixes (517/517 tests passing)
- ✅ Phase 1: v2 Authentication (httpOnly cookies, secure)

**Current State:**
- Build: ✅ Successful
- Tests: ✅ 517/517 passing (100%)
- Security: ✅ XSS-proof authentication
- Production Ready: ❌ Infrastructure gaps, no deployment config

**Remaining Work:**
1. CSRF Protection Integration (2h)
2. Infrastructure Hardening (6-8h)
3. Vercel Deployment Setup (2-3h)
4. Final Testing & Verification (2-3h)

---

## 🎯 PARALLEL EXECUTION STRATEGY

Execute 6 agent teams simultaneously:

- **TRACK A:** CSRF Protection (1 agent)
- **TRACK B:** Infrastructure - Redis & Rate Limiting (1 agent)
- **TRACK C:** Infrastructure - Monitoring & Logging (1 agent)
- **TRACK D:** Database Optimization (1 agent)
- **TRACK E:** Vercel Deployment Configuration (1 agent)
- **TRACK F:** Environment & Secrets (1 agent)

After parallel tracks complete:
- **TRACK G:** Integration Testing (1 agent)
- **TRACK H:** Vercel Deployment & Verification (1 agent)

---

## 📦 TRACK A: CSRF Protection Integration (2 hours)

### Agent Assignment: CSRF Integration Specialist

**Status:** 🟡 Middleware built and tested, not integrated

**What Exists:**
- `src/middleware/csrf.ts` - Full implementation, 17 tests passing
- `src/middleware/csrf.test.ts` - 86.36% coverage

**What's Needed:**

### 1. Add CSRF Middleware to Protected Endpoints (1h)

**Files to Update:**
- `src/pages/api/auth/[...auth].ts` - POST endpoints (login, register, logout)
- `src/pages/api/tarot-reading.ts` - POST/PUT endpoints
- `src/pages/api/auth/forgot-password.ts` - POST
- `src/pages/api/auth/reset-password.ts` - POST

**Pattern:**
```typescript
import { getCSRFService } from '@/src/middleware/csrf'

const csrfService = getCSRFService()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // For GET requests (generate token)
  if (req.method === 'GET') {
    const csrfToken = await csrfService.generateToken(req, res)
    return sendSuccess(res, { csrfToken })
  }

  // For POST/PUT/DELETE (validate token)
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    await csrfService.validateToken(req)
    // ... rest of handler
  }
}
```

### 2. Add CSRF Token to Client Forms (1h)

**Create CSRF Hook:**
```typescript
// src/hooks/useCSRFToken.ts
export function useCSRFToken() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/csrf', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCSRFToken(data.data.csrfToken))
  }, [])

  return csrfToken
}
```

**Update Components:**
- `src/components/Login.tsx` - Include CSRF token in request
- `src/components/Register.tsx` - Include CSRF token
- `src/components/ForgotPassword.tsx` - Include CSRF token
- `src/components/ResetPassword.tsx` - Include CSRF token

**Update useApiRequest Hook:**
```typescript
// Add CSRF token to headers automatically
headers: {
  'Content-Type': 'application/json',
  'X-CSRF-Token': csrfToken,
  ...headers,
}
```

**Deliverables:**
- [ ] CSRF middleware integrated in all POST/PUT/DELETE endpoints
- [ ] useCSRFToken hook created
- [ ] All forms include CSRF token
- [ ] Tests updated and passing
- [ ] CSRF protection verified

---

## 📦 TRACK B: Redis & Distributed Rate Limiting (6 hours)

### Agent Assignment: Infrastructure - Redis Specialist

**Status:** 🟡 v2 rate limiter built with Redis support, not configured

**What Exists:**
- `src/middleware/rateLimit.v2.ts` - Full implementation with Upstash
- In-memory fallback implemented
- 22 tests passing

**What's Needed:**

### 1. Setup Upstash Redis (1h)

**Create Upstash Account & Database:**
- Sign up at https://upstash.com
- Create new Redis database (free tier)
- Get credentials: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

**Update Environment Variables:**
```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### 2. Replace In-Memory Rate Limiter (2h)

**Files to Update:**
- `src/middleware/rateLimit.ts` - Mark as deprecated
- `src/pages/api/auth/[...auth].ts` - Switch to rateLimit.v2
- `src/pages/api/tarot-reading.ts` - Already using v2 ✅
- `src/pages/api/user/readings.ts` - Already using v2 ✅
- `src/pages/api/auth/forgot-password.ts` - Switch to v2
- `src/pages/api/auth/reset-password.ts` - Switch to v2

**Pattern:**
```typescript
import { getRateLimiter } from '@/src/middleware/rateLimit.v2'

const rateLimiter = getRateLimiter()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const identifier = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  const result = await rateLimiter.checkLimit(identifier, 'auth:login')

  if (!result.allowed) {
    return sendError(res, new RateLimitError('Too many requests', result.retryAfter))
  }

  // ... rest of handler
}
```

### 3. Configure Rate Limit Actions (1h)

**Update Limits:**
```typescript
// src/middleware/rateLimit.v2.ts
const RATE_LIMITS: Record<RateLimitAction, RateLimitConfig> = {
  'auth:login': { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15min
  'auth:register': { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  'auth:password-reset': { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  'tarot:reading': { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  'api:general': { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
}
```

### 4. Remove In-Memory Cache (1h)

**Files to Update:**
- Remove `src/lib/cache.ts` if it exists
- Update any code using in-memory caching to use Redis
- Document Redis usage in README

### 5. Testing (1h)

**Create Redis Integration Tests:**
```typescript
// __tests__/middleware/rateLimit.v2.integration.test.ts
describe('Rate Limiting with Redis', () => {
  it('should limit requests across multiple instances')
  it('should reset after window expires')
  it('should fall back to memory if Redis unavailable')
})
```

**Deliverables:**
- [ ] Upstash Redis configured
- [ ] All endpoints using rateLimit.v2
- [ ] In-memory cache removed
- [ ] Rate limits optimized
- [ ] Integration tests passing

---

## 📦 TRACK C: Monitoring & Logging (4 hours)

### Agent Assignment: Infrastructure - Observability Specialist

**Status:** 🔴 No monitoring, console.log only

**What's Needed:**

### 1. Sentry Integration (2h)

**Install Sentry:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configure Sentry:**
```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers?.Authorization
    }
    return event
  }
})

// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

**Integrate with Error Handler:**
```typescript
// src/middleware/errorHandler.v2.ts
import * as Sentry from '@sentry/nextjs'

export function errorHandler(error: Error, req: NextApiRequest, res: NextApiResponse) {
  // Log to Sentry
  Sentry.captureException(error, {
    tags: {
      endpoint: req.url,
      method: req.method,
    },
    user: {
      id: req.userId || 'anonymous',
    },
  })

  // ... rest of error handling
}
```

### 2. Structured Logging with Pino (2h)

**Install Pino:**
```bash
npm install pino pino-pretty
```

**Create Logger:**
```typescript
// src/utils/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  ...(process.env.NODE_ENV === 'production' && {
    formatters: {
      level: (label) => ({ level: label }),
    },
  }),
})

// Helper functions
export function logRequest(req: NextApiRequest, userId?: string) {
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    userId,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  })
}

export function logError(error: Error, context?: Record<string, any>) {
  logger.error({
    type: 'error',
    message: error.message,
    stack: error.stack,
    ...context,
  })
}
```

**Replace console.log:**
- Search for all `console.log` in src/
- Replace with `logger.info()`, `logger.error()`, etc.
- Keep console.log only in tests

**Deliverables:**
- [ ] Sentry configured and integrated
- [ ] Pino logger implemented
- [ ] All console.log replaced
- [ ] Error tracking verified
- [ ] Log levels configured

---

## 📦 TRACK D: Database Optimization (2 hours)

### Agent Assignment: Database Specialist

**Status:** 🟡 Indexes defined in models, not verified

**What's Needed:**

### 1. Verify and Create Indexes (1h)

**Check Existing Indexes:**
```typescript
// scripts/check-indexes.ts
import mongoose from 'mongoose'
import { User, Reading, PasswordReset } from '@/src/models'

async function checkIndexes() {
  await mongoose.connect(process.env.MONGODB_URI!)

  console.log('User indexes:', await User.collection.getIndexes())
  console.log('Reading indexes:', await Reading.collection.getIndexes())
  console.log('PasswordReset indexes:', await PasswordReset.collection.getIndexes())

  await mongoose.disconnect()
}

checkIndexes()
```

**Add Missing Indexes:**
```typescript
// User model
userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ username: 1 }, { unique: true })
userSchema.index({ createdAt: 1 })

// Reading model
readingSchema.index({ userId: 1, createdAt: -1 })
readingSchema.index({ createdAt: 1 })

// PasswordReset model
passwordResetSchema.index({ userId: 1 })
passwordResetSchema.index({ token: 1 }, { unique: true })
passwordResetSchema.index({ expiresAt: 1 })
```

### 2. Add Database Connection Pooling (30min)

**Update MongoDB Connection:**
```typescript
// src/lib/mongodb.ts
const options = {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

mongoose.connect(process.env.MONGODB_URI!, options)
```

### 3. Add Query Performance Monitoring (30min)

**Add Slow Query Logging:**
```typescript
// src/lib/mongodb.ts
mongoose.set('debug', (collectionName, method, query, doc) => {
  const start = Date.now()

  mongoose.set('debug', false)

  const end = Date.now()
  const duration = end - start

  if (duration > 100) {
    logger.warn({
      type: 'slow_query',
      collection: collectionName,
      method,
      duration,
      query: JSON.stringify(query),
    })
  }
})
```

**Deliverables:**
- [ ] All indexes verified and created
- [ ] Connection pooling configured
- [ ] Slow query monitoring added
- [ ] Database performance tested

---

## 📦 TRACK E: Vercel Deployment Configuration (3 hours)

### Agent Assignment: DevOps - Deployment Specialist

**Status:** 🔴 No deployment configuration

**What's Needed:**

### 1. Create Vercel Configuration (30min)

**Create vercel.json:**
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "MONGODB_URI": "@mongodb-uri",
    "JWT_SECRET": "@jwt-secret",
    "UPSTASH_REDIS_REST_URL": "@upstash-redis-url",
    "UPSTASH_REDIS_REST_TOKEN": "@upstash-redis-token",
    "SENTRY_DSN": "@sentry-dsn",
    "XAI_API_KEY": "@xai-api-key",
    "RESEND_API_KEY": "@resend-api-key",
    "NEXT_PUBLIC_SENTRY_DSN": "@next-public-sentry-dsn"
  },
  "functions": {
    "src/pages/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

**Update next.config.js:**
```javascript
const { withSentryConfig } = require('@sentry/nextjs')

const moduleExports = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

module.exports = withSentryConfig(moduleExports, {
  silent: true,
  org: 'your-org',
  project: 'pettyprophecies',
})
```

### 2. Environment Variable Management (1h)

**Create .env.example:**
```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tarot

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Monitoring (Sentry)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=your-auth-token

# AI (xAI Grok)
XAI_API_KEY=your-xai-api-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
LOG_LEVEL=info
```

**Create Environment Validation:**
```typescript
// src/utils/env.ts
import { z } from 'zod'

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  JWT_SECRET: z.string().min(32),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  XAI_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

export function validateEnv() {
  try {
    envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Invalid environment variables:', error)
    process.exit(1)
  }
}
```

### 3. Create Deployment Scripts (30min)

**Add to package.json:**
```json
{
  "scripts": {
    "deploy:preview": "vercel",
    "deploy:production": "vercel --prod",
    "vercel-build": "npm run validate:env && next build",
    "validate:env": "ts-node src/utils/env.ts",
    "postbuild": "next-sitemap"
  }
}
```

### 4. Setup GitHub Integration (1h)

**Create .github/workflows/deploy.yml:**
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --ci --coverage

      - name: Build
        run: npm run build
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
```

**Deliverables:**
- [ ] vercel.json created
- [ ] next.config.js updated
- [ ] .env.example documented
- [ ] Environment validation implemented
- [ ] GitHub Actions workflow created
- [ ] Deployment scripts added

---

## 📦 TRACK F: Environment & Secrets Management (1 hour)

### Agent Assignment: Security - Secrets Specialist

**Status:** 🔴 Hardcoded secrets, no validation

**What's Needed:**

### 1. Audit and Remove Hardcoded Secrets (30min)

**Search for Hardcoded Values:**
```bash
grep -r "mongodb+srv://" src/
grep -r "jwt.sign.*secret" src/
grep -r "API_KEY.*=" src/
```

**Replace with Environment Variables:**
```typescript
// WRONG:
const secret = 'my-secret-key'

// RIGHT:
const secret = process.env.JWT_SECRET
if (!secret) throw new Error('JWT_SECRET not configured')
```

### 2. Create Secrets Documentation (30min)

**Create DEPLOYMENT.md:**
```markdown
# Deployment Guide

## Required Environment Variables

### Production Requirements
- MONGODB_URI: MongoDB connection string (required)
- JWT_SECRET: 32+ character secret for JWT signing (required)
- NEXT_PUBLIC_APP_URL: Your deployed app URL (required)

### Optional Services
- UPSTASH_REDIS_REST_URL: Redis for distributed rate limiting
- UPSTASH_REDIS_REST_TOKEN: Redis authentication token
- SENTRY_DSN: Error monitoring
- XAI_API_KEY: AI-powered tarot readings
- RESEND_API_KEY: Transactional emails

## Vercel Setup

1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Add secrets: `vercel env add MONGODB_URI`
5. Deploy: `vercel --prod`
```

**Deliverables:**
- [ ] No hardcoded secrets
- [ ] Environment validation working
- [ ] DEPLOYMENT.md created
- [ ] Secret rotation guide documented

---

## 📦 TRACK G: Integration Testing (3 hours)

### Agent Assignment: QA - Integration Testing Specialist

**Status:** 🟡 Unit tests 100%, no E2E tests

**What's Needed:**

### 1. Create E2E Test Suite (2h)

**Install Playwright:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Create E2E Tests:**
```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can register, login, and logout', async ({ page }) => {
    // Register
    await page.goto('/register')
    await page.fill('[name="username"]', 'testuser')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard')

    // Get tarot reading
    await page.click('text=Get Reading')
    await page.selectOption('[name="spread"]', 'three-card')
    await page.click('button[type="submit"]')

    // Verify reading displayed
    await expect(page.locator('.tarot-card')).toHaveCount(3)

    // Logout
    await page.click('text=Logout')
    await expect(page).toHaveURL('/')
  })

  test('password reset flow works', async ({ page }) => {
    // Request reset
    await page.goto('/forgot-password')
    await page.fill('[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Verify success message
    await expect(page.locator('text=Reset link sent')).toBeVisible()
  })
})

// e2e/tarot-reading.spec.ts
test.describe('Tarot Reading Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
  })

  test('can generate AI-powered reading', async ({ page }) => {
    await page.goto('/tarot')
    await page.check('[name="useAI"]')
    await page.selectOption('[name="spread"]', 'celtic-cross')
    await page.click('button[type="submit"]')

    // Wait for AI generation
    await page.waitForSelector('.ai-badge')
    await expect(page.locator('.interpretation')).toContainText('AI')
  })

  test('can rate reading', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('.reading-card >> nth=0')
    await page.click('[aria-label="Rate 5 stars"]')

    // Verify rating saved
    await expect(page.locator('.rating-display')).toContainText('5')
  })
})
```

**Create playwright.config.ts:**
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

### 2. Create API Integration Tests (1h)

**Test Full Flows:**
```typescript
// __tests__/integration/auth-flow.integration.test.ts
describe('Complete Authentication Flow', () => {
  it('should complete registration -> login -> logout', async () => {
    // Register
    const registerRes = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'integrationtest',
        email: 'integration@test.com',
        password: 'SecurePass123!',
      }),
    })
    expect(registerRes.ok).toBe(true)

    // Login
    const loginRes = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'integration@test.com',
        password: 'SecurePass123!',
      }),
      credentials: 'include',
    })
    expect(loginRes.ok).toBe(true)

    // Access protected route
    const readingRes = await fetch('/api/tarot-reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadName: 'three-card', useAI: false }),
      credentials: 'include',
    })
    expect(readingRes.ok).toBe(true)

    // Logout
    const logoutRes = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    expect(logoutRes.ok).toBe(true)
  })
})
```

**Deliverables:**
- [ ] Playwright installed and configured
- [ ] E2E tests for auth flow
- [ ] E2E tests for tarot reading
- [ ] API integration tests
- [ ] All tests passing

---

## 📦 TRACK H: Vercel Deployment & Verification (2 hours)

### Agent Assignment: DevOps - Deployment Executor

**Prerequisites:** All other tracks must be complete

**What's Needed:**

### 1. Pre-Deployment Checklist (30min)

- [ ] All tests passing (517/517)
- [ ] Build succeeds locally
- [ ] Environment variables documented
- [ ] No console.error in production code
- [ ] No hardcoded secrets
- [ ] Database indexes created
- [ ] Redis configured
- [ ] Sentry configured

### 2. Deploy to Vercel Preview (30min)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Test preview deployment
curl https://your-preview-url.vercel.app/api/health
```

**Verify Preview:**
- [ ] App loads
- [ ] Can register user
- [ ] Can login
- [ ] Can get tarot reading
- [ ] Can logout
- [ ] Check Sentry for errors
- [ ] Check Vercel logs

### 3. Deploy to Production (30min)

```bash
# Deploy to production
vercel --prod

# Verify production
curl https://your-app.vercel.app/api/health
```

### 4. Post-Deployment Verification (30min)

**Smoke Tests:**
```bash
# Health check
curl https://your-app.vercel.app/api/health

# Auth endpoints
curl https://your-app.vercel.app/api/auth/verify

# Test registration (use real email)
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"SecurePass123!"}'
```

**Monitor:**
- Check Sentry dashboard for errors
- Check Vercel logs for issues
- Check Upstash Redis for connections
- Test from different browsers
- Test on mobile device

**Performance:**
- Run Lighthouse audit
- Check page load times
- Verify API response times < 500ms
- Check bundle size

**Deliverables:**
- [ ] Preview deployment successful
- [ ] Production deployment successful
- [ ] All smoke tests passing
- [ ] No errors in Sentry
- [ ] Performance metrics acceptable
- [ ] Custom domain configured (optional)

---

## 🎯 Final Verification Checklist

### Security
- [x] No JWT in localStorage (httpOnly cookies)
- [ ] CSRF protection on all mutations
- [ ] Rate limiting with Redis
- [ ] Input validation on all endpoints
- [ ] XSS protection headers
- [ ] No hardcoded secrets
- [ ] Secure cookie attributes (httpOnly, SameSite, Secure)

### Performance
- [ ] Database indexes created
- [ ] Connection pooling enabled
- [ ] Redis for distributed caching
- [ ] Optimized bundle size
- [ ] Image optimization
- [ ] API response times < 500ms

### Reliability
- [ ] Error monitoring (Sentry)
- [ ] Structured logging (Pino)
- [ ] Health check endpoint
- [ ] Graceful error handling
- [ ] Database connection retry logic

### Testing
- [x] 517/517 unit tests passing
- [ ] E2E tests passing
- [ ] Integration tests passing
- [ ] Manual smoke tests completed

### Documentation
- [ ] README updated
- [ ] DEPLOYMENT.md created
- [ ] API documentation
- [ ] Environment variables documented
- [ ] Architecture diagrams

---

## 📊 Success Metrics

**Must Have (Blocker):**
- ✅ All tests passing
- ✅ Build succeeds
- ✅ No security vulnerabilities
- [ ] App deploys to Vercel
- [ ] Core flows work (register, login, reading)

**Should Have (Important):**
- [ ] Redis configured
- [ ] Sentry monitoring
- [ ] E2E tests passing
- [ ] Performance acceptable
- [ ] Documentation complete

**Nice to Have (Optional):**
- [ ] Custom domain
- [ ] Email templates styled
- [ ] Analytics integration
- [ ] SEO optimization
- [ ] Social media cards

---

## 🚀 Deployment Timeline

**Parallel Execution (Tracks A-F): 6-8 hours**
- All tracks can run simultaneously
- Regular sync points to verify integration

**Sequential Execution (Tracks G-H): 5 hours**
- Track G: Integration testing (3h)
- Track H: Deployment & verification (2h)

**Total Estimated Time: 12-18 hours**
- With 6 agents in parallel: ~8-10 hours
- Buffer for issues: +2-3 hours
- Includes testing and verification

---

## 🎬 Execution Order

### Phase 1: Parallel Tracks (Start Immediately)
```
TRACK A: CSRF Protection          [Agent 1]
TRACK B: Redis & Rate Limiting    [Agent 2]
TRACK C: Monitoring & Logging     [Agent 3]
TRACK D: Database Optimization    [Agent 4]
TRACK E: Vercel Configuration     [Agent 5]
TRACK F: Environment & Secrets    [Agent 6]
```

**Sync Point 1:** All agents report completion (~6-8 hours)

### Phase 2: Integration (Sequential)
```
TRACK G: Integration Testing      [Agent 7]
```

**Sync Point 2:** All tests passing (~3 hours)

### Phase 3: Deployment (Sequential)
```
TRACK H: Vercel Deployment        [Agent 8]
```

**Final Checkpoint:** Production verified (~2 hours)

---

## 📝 Notes

- Each track is independent and can be worked on in parallel
- Tracks A-F have no dependencies on each other
- Track G requires all of A-F to be complete
- Track H requires G to be complete
- Regular commits after each track completion
- Test after each track to catch issues early

**Ready for parallel execution! 🚀**
