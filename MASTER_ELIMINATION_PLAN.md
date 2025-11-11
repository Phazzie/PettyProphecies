# 🎯 Master Elimination Plan - Path to Production

**Date:** 2025-11-11
**Status:** 🔴 **NOT PRODUCTION READY**
**Build Status:** 🔴 **BROKEN** (critical import error)
**Estimated Time to Production:** **40-50 hours** (1 week intensive)

---

## Executive Summary

Three comprehensive audits have been completed:
- **Code Review:** 52 issues identified across security, quality, architecture
- **Technical Debt Audit:** 130 hours of debt, incomplete v2 refactoring
- **Test Failure Analysis:** 30 failing tests, all fixable in 2-3 hours

**Current State:**
- ✅ Excellent new v2 architecture (tested, ready)
- ❌ v2 not integrated (old system still in use)
- ❌ Build broken (import error)
- ❌ 30 tests failing (infrastructure issues)
- ❌ Production blockers (in-memory cache, rate limiter)

---

## 🚨 PHASE 0: Emergency Fixes (2-3 hours)

**MUST DO BEFORE ANYTHING ELSE**

### 0.1 Fix Build-Breaking Import (5 min)

**File:** `src/pages/api/auth/forgot-password.ts`

```typescript
// Line 118 - CHANGE FROM:
const { EmailService } = await import("../../../services/EmailService")

// TO:
const { EmailService } = await import("../../../services/email")
```

**Also fix:** `src/pages/api/auth/reset-password.ts` (same issue)

**Verification:**
```bash
npm run build
# Should complete without errors
```

---

### 0.2 Fix All 30 Failing Tests (2 hours)

#### Fix 1: Add fetch polyfill (5 min)

**File:** `jest.setup.js`

Add after line 29:
```javascript
// Add fetch polyfill for jsdom
global.fetch = jest.fn()
global.Request = jest.fn()
global.Response = jest.fn()
global.Headers = jest.fn()
```

#### Fix 2: Add index() method to MockSchema (10 min)

**File:** `jest.setup.js`

Find MockSchema class (~line 35) and add:
```javascript
class MockSchema {
  constructor(definition) {
    this.definition = definition
    this._indexes = []
  }

  // ADD THIS METHOD:
  index(fields, options) {
    this._indexes.push({ fields, options })
    return this
  }

  // ... rest of methods
}
```

#### Fix 3: Fix Next.js router mock (10 min)

**File:** `__tests__/components/ResetPassword.test.tsx`

Change line 7:
```typescript
// FROM:
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}))

// TO:
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  pathname: "/",
  query: {},
  asPath: "/",
}

jest.mock("next/router", () => ({
  useRouter: () => mockRouter,
}))
```

#### Fix 4: Fix ForgotPassword mock isolation (30 min)

**File:** `__tests__/components/ForgotPassword.test.tsx`

Replace lines 12-22:
```typescript
const mockUseApiRequest = {
  makeRequest: jest.fn(),
  loading: false,
  error: null,
}

jest.mock("@/src/hooks/useApiRequest", () => ({
  useApiRequest: () => mockUseApiRequest,
}))

beforeEach(() => {
  jest.clearAllMocks()
  mockUseApiRequest.loading = false
  mockUseApiRequest.error = null
  mockUseApiRequest.makeRequest.mockReset()
})
```

#### Fix 5: Update TarotReading test queries (5 min)

**File:** `__tests__/components/TarotReading.test.tsx`

Find tests looking for "Get Reading" button and change to:
```typescript
// FROM:
const button = screen.getByRole("button", { name: /get reading/i })

// TO:
const button = screen.getByRole("button", { name: /get reading|loading/i })
```

#### Fix 6: Add error display to ForgotPassword (30 min)

**File:** `src/components/ForgotPassword.tsx`

Add after line 82 (inside form, before button):
```typescript
{error && (
  <div className="text-red-600 text-sm" role="alert">
    {error}
  </div>
)}
```

**Verification:**
```bash
npm run test:ci
# Should show: Tests: 498 passed, 5 failed (accessibility)
```

---

### 0.3 Fix Accessibility Issues (1 hour)

#### ForgotPassword Component

**File:** `src/components/ForgotPassword.tsx`

Update input (around line 70):
```typescript
<input
  id="email"
  name="email"
  type="email"
  required
  aria-invalid={!!error}  // ADD THIS
  aria-describedby={error ? "email-error" : undefined}  // ADD THIS
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="..."
/>
{error && (
  <div id="email-error" className="text-red-600 text-sm" role="alert">
    {error}
  </div>
)}
```

#### ResetPassword Component

**File:** `src/components/ResetPassword.tsx`

Update password inputs (around lines 110, 125):
```typescript
<input
  id="password"
  name="password"
  type="password"
  required
  aria-invalid={!!error}  // ADD THIS
  aria-describedby={error ? "password-error" : undefined}  // ADD THIS
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="..."
/>
// ... same for confirmPassword
```

**Verification:**
```bash
npm run test:ci
# Should show: Tests: 503 passed, 0 failed ✅
```

---

## ✅ CHECKPOINT 1: Working Build (ETA: 3 hours from start)

At this point you should have:
- ✅ Build succeeds
- ✅ All 503 tests passing
- ✅ Accessibility issues fixed
- ❌ Still not production-ready (v2 not integrated, infrastructure issues)

---

## 🔄 PHASE 1: Integrate v2 Middleware (12-16 hours)

**Goal:** Replace old vulnerable systems with new secure v2 implementations

### 1.1 Delete Duplicate AuthContext (15 min)

```bash
# Delete the duplicate
rm src/contexts/AuthContext.tsx

# Update imports in affected files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's|from.*contexts/AuthContext|from "@/lib/AuthContext"|g' {} +
```

**Affected files:**
- `src/components/Login.tsx`
- `src/components/Register.tsx`
- `src/components/UserDashboard.tsx`
- `src/components/TarotReading.tsx`

**Verification:**
```bash
npm run build
# Should still succeed
```

---

### 1.2 Migrate Authentication to httpOnly Cookies (6-8 hours)

**This is the BIG migration - requires careful coordination**

#### Step 1: Update Login API (1 hour)

**File:** `src/pages/api/auth/[...auth].ts`

Replace `handleLogin` function (around line 60):

```typescript
import { getAuthService } from '@/src/middleware/auth.v2'
import { validateRequest } from '@/src/middleware/validateRequest'
import { sendSuccess } from '@/src/utils/apiResponse'
import { errorHandler } from '@/src/middleware/errorHandler.v2'

const authService = getAuthService()

// Wrap with validation
async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, password } = req.body

    // Validate inputs
    if (!email || !password) {
      throw new ValidationError("Email and password are required")
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      throw new AuthenticationError("Invalid credentials")
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new AuthenticationError("Invalid credentials")
    }

    // Set httpOnly cookie (NEW!)
    await authService.setAuthCookie(res, user._id.toString())

    // Return success (NO TOKEN in response body!)
    return sendSuccess(res, {
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    })
  } catch (error) {
    return errorHandler(error, req, res)
  }
}
```

#### Step 2: Update Register API (1 hour)

**File:** `src/pages/api/auth/[...auth].ts`

Replace `handleRegister` function (around line 30):

```typescript
import { UserRepository } from '@/src/repositories/UserRepository'
import { emailService } from '@/src/services/email'

const userRepo = new UserRepository()

async function handleRegister(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { username, email, password } = req.body

    // Validate inputs
    if (!username || !email || !password) {
      throw new ValidationError("All fields are required")
    }

    // Create user using repository
    const user = await userRepo.create({
      username,
      email: email.toLowerCase(),
      password  // Will be hashed by User model pre-save hook
    })

    // Set httpOnly cookie
    await authService.setAuthCookie(res, user._id.toString())

    // Send welcome email (async, don't wait)
    emailService.sendWelcome(email, username).catch(err => {
      console.error('Failed to send welcome email:', err)
    })

    return sendSuccess(res, {
      message: "Registration successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    }, 201)
  } catch (error) {
    return errorHandler(error, req, res)
  }
}
```

#### Step 3: Update Logout API (15 min)

**File:** `src/pages/api/auth/[...auth].ts`

Replace `handleLogout`:

```typescript
async function handleLogout(req: NextApiRequest, res: NextApiResponse) {
  authService.clearAuthCookie(res)
  return sendSuccess(res, { message: "Logged out successfully" })
}
```

#### Step 4: Update Protected Routes (2 hours)

**Files to update:**
- `src/pages/api/tarot-reading.ts`
- `src/pages/api/user/readings.ts`

**Pattern:**

```typescript
import { getAuthService } from '@/src/middleware/auth.v2'
import { getRateLimiter } from '@/src/middleware/rateLimit.v2'
import { getCSRFService } from '@/src/middleware/csrf'
import { errorHandler } from '@/src/middleware/errorHandler.v2'
import { sendSuccess } from '@/src/utils/apiResponse'

const authService = getAuthService()
const rateLimiter = getRateLimiter()
const csrfService = getCSRFService()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. Verify authentication
    const userId = await authService.requireAuth(req)

    // 2. Check rate limit
    const rateLimit = await rateLimiter.checkLimit(userId, 'reading')
    if (!rateLimit.allowed) {
      throw new RateLimitError('Too many requests', rateLimit.resetAt)
    }
    res.setHeader('X-RateLimit-Limit', rateLimit.limit.toString())
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString())

    // 3. CSRF validation for POST/PUT/DELETE
    if (['POST', 'PUT', 'DELETE'].includes(req.method!)) {
      await csrfService.validateToken(req)
    }

    // 4. Your endpoint logic
    if (req.method === 'POST') {
      // ... create reading
      return sendSuccess(res, reading, 201)
    }

    // ... other methods
  } catch (error) {
    return errorHandler(error, req, res)
  }
}
```

#### Step 5: Update Client-Side Code (2-3 hours)

**File:** `lib/AuthContext.tsx`

**MAJOR CHANGES:**

```typescript
'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'

interface User {
  id: string
  username: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCSRFToken] = useState<string | null>(null)

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'  // CRITICAL: Send cookies
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)

        // Get CSRF token from header
        const token = response.headers.get('X-CSRF-Token')
        if (token) setCSRFToken(token)
      }
    } catch (error) {
      console.error('Session check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',  // CRITICAL: Send/receive cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed')
    }

    setUser(data.data.user)

    // Get CSRF token
    const token = response.headers.get('X-CSRF-Token')
    if (token) setCSRFToken(token)
  }

  const register = async (username: string, email: string, password: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'include',  // CRITICAL: Send/receive cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Registration failed')
    }

    setUser(data.data.user)

    // Get CSRF token
    const token = response.headers.get('X-CSRF-Token')
    if (token) setCSRFToken(token)
  }

  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'GET',
      credentials: 'include'  // CRITICAL: Send cookies
    })

    setUser(null)
    setCSRFToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export CSRF token for use in other components
export function useCSRFToken() {
  const context = useContext(AuthContext)
  return context?.csrfToken || null
}
```

**Update all fetch calls in components:**

```typescript
// OLD:
const token = localStorage.getItem('token')
fetch('/api/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }
})

// NEW:
import { useCSRFToken } from '@/lib/AuthContext'

const csrfToken = useCSRFToken()

fetch('/api/endpoint', {
  method: 'POST',
  credentials: 'include',  // CRITICAL!
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken  // For POST/PUT/DELETE
  }
})
```

**Files to update:**
- `src/components/TarotReading.tsx`
- `src/components/UserDashboard.tsx`
- `src/components/Login.tsx`
- `src/components/Register.tsx`

#### Step 6: Create Session Endpoint (30 min)

**New file:** `src/pages/api/auth/session.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next'
import { getAuthService } from '@/src/middleware/auth.v2'
import { getCSRFService } from '@/src/middleware/csrf'
import { sendSuccess } from '@/src/utils/apiResponse'
import { errorHandler } from '@/src/middleware/errorHandler.v2'
import { UserRepository } from '@/src/repositories/UserRepository'

const authService = getAuthService()
const csrfService = getCSRFService()
const userRepo = new UserRepository()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Generate CSRF token for this session
    const csrfToken = await csrfService.generateToken(req, res)

    // Check if authenticated
    const userId = await authService.verifyToken(req)

    if (!userId) {
      // Not authenticated - return CSRF token only
      return sendSuccess(res, { authenticated: false })
    }

    // Get user data
    const user = await userRepo.findById(userId)

    if (!user) {
      authService.clearAuthCookie(res)
      return sendSuccess(res, { authenticated: false })
    }

    return sendSuccess(res, {
      authenticated: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    })
  } catch (error) {
    return errorHandler(error, req, res)
  }
}
```

#### Step 7: Testing Checklist

```bash
# 1. Build succeeds
npm run build

# 2. All tests pass
npm run test:ci

# 3. Manual testing:
# - Register new user → Should receive cookie
# - Login → Should receive cookie
# - Access protected route → Should work with cookie
# - Logout → Cookie should be cleared
# - Try to access protected route after logout → Should fail

# 4. Check cookies in browser DevTools:
# - Name: "token"
# - HttpOnly: true
# - Secure: true (in production)
# - SameSite: Strict
```

---

## ✅ CHECKPOINT 2: Cookie-Based Auth (ETA: 11 hours from Checkpoint 1)

At this point:
- ✅ httpOnly cookies implemented
- ✅ CSRF protection integrated
- ✅ No more localStorage
- ✅ All authentication migrated
- ❌ Still need to fix infrastructure (rate limiter, monitoring)

---

## 🏗️ PHASE 2: Infrastructure Hardening (12-16 hours)

### 2.1 Replace In-Memory Rate Limiter (6-8 hours)

**Goal:** Make rate limiting work in serverless/distributed environments

#### Option A: Use Upstash (Recommended for Vercel)

**Setup Upstash:**
1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database
3. Get credentials:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

**Update `.env.example`:**
```bash
# Add to .env.example
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

**The code is already implemented!** - Agent 1 did this in `src/middleware/rateLimit.v2.ts`

Just set the environment variables and it works!

**Verification:**
```bash
# In .env.local, add your Upstash credentials
# Test:
curl -X POST http://localhost:3000/api/tarot-reading \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your-token" \
  -d '{"spreadType":"test"}'

# Make 21 requests rapidly
# Should get 429 Too Many Requests on 21st request
```

**Time:** 2 hours (including Upstash setup)

#### Option B: Use in-memory with warning (Not recommended)

If you can't use Redis:
- Document the limitation
- Add warning to deployment docs
- Plan for future Redis migration

**Time:** 30 minutes (documentation only)

---

### 2.2 Remove In-Memory API Cache (3 hours)

**Current issue:** `src/utils/api.ts` uses in-memory cache (doesn't work in serverless)

**Solution:** Use Next.js native caching

**File:** `src/utils/api.ts`

Remove the entire cache implementation (lines 12-40):

```typescript
// DELETE THIS:
const cache: { [key: string]: CacheItem<any> } = {}

interface CacheItem<T> {
  data: T
  timestamp: number
}

function getCacheKey(url: string, options?: RequestInit): string {
  // ... delete all cache logic
}

// REPLACE WITH:
// Use Next.js native fetch caching
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit & { revalidate?: number }
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    next: {
      revalidate: options?.revalidate || 300  // 5 minutes default
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}
```

**Update usage:**
```typescript
// OLD:
const data = await apiRequest('/api/endpoint')

// NEW:
const data = await fetchWithCache('/api/endpoint', { revalidate: 300 })
```

**Time:** 3 hours (including testing)

---

### 2.3 Add Production Monitoring (4-6 hours)

#### Setup Sentry

1. **Sign up:** [sentry.io](https://sentry.io)
2. **Create project:** Next.js
3. **Get DSN:** Copy from project settings

**File:** `lib/sentry.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/yourapp\.com/],
      }),
      new Sentry.Replay(),
    ],

    beforeSend(event) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null
      }
      return event
    }
  })
}

export default Sentry
```

**Update error handler:**

**File:** `src/middleware/errorHandler.v2.ts`

Add Sentry capture (around line 15):

```typescript
import Sentry from '@/lib/sentry'

export function errorHandler(error: unknown, req: NextApiRequest, res: NextApiResponse) {
  // Log to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      contexts: {
        request: {
          method: req.method,
          url: req.url,
          headers: req.headers,
        },
      },
    })
  }

  // ... rest of error handling
}
```

**Time:** 4 hours (including testing)

---

### 2.4 Replace Console Logger (2-3 hours)

**Install Pino:**
```bash
npm install pino pino-pretty
```

**Create logger:**

**File:** `src/utils/logger.v2.ts`

```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label.toUpperCase() })
  },
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname'
        }
      }
    : undefined,
})

export default logger
```

**Replace all console.log:**

```bash
# Find all console.log
grep -r "console\." src --include="*.ts" --include="*.tsx"

# Replace with logger:
# console.log → logger.info
# console.error → logger.error
# console.warn → logger.warn
```

**Time:** 2-3 hours

---

### 2.5 Add Database Indexes (30 min)

**Already documented!** See `docs/DATABASE_INDEXES.md`

**BUT - Missing one critical index:**

**File:** `src/models/Reading.ts`

Add after schema definition (around line 30):

```typescript
// Add compound index for efficient user queries with sorting
readingSchema.index({ userId: 1, createdAt: -1 })

// Add index for createdAt sorting
readingSchema.index({ createdAt: -1 })

export const Reading = mongoose.models.Reading || mongoose.model<IReading>('Reading', readingSchema)
```

**Time:** 30 minutes (including MongoDB verification)

---

## ✅ CHECKPOINT 3: Production Infrastructure (ETA: 14 hours from Checkpoint 2)

At this point:
- ✅ Distributed rate limiting (Upstash)
- ✅ No in-memory caching
- ✅ Sentry monitoring
- ✅ Proper logging (Pino)
- ✅ Database indexes optimized
- ❌ Still need final testing and deployment prep

---

## 🚀 PHASE 3: Final Production Prep (8-12 hours)

### 3.1 Security Audit (4 hours)

**Run security checks:**

```bash
# 1. npm audit
npm audit --production

# 2. Check for hardcoded secrets
grep -r "API_KEY\|SECRET\|PASSWORD" src --include="*.ts" --include="*.tsx" | grep -v "process.env"

# 3. Check CORS configuration
# 4. Verify HTTPS redirect in production
# 5. Check rate limit values are appropriate
```

**Security checklist:**
- [ ] All environment variables use `process.env`
- [ ] No hardcoded secrets in code
- [ ] httpOnly cookies enabled
- [ ] CSRF protection on all POST/PUT/DELETE
- [ ] Rate limiting on all endpoints
- [ ] Input validation on all endpoints (Zod)
- [ ] XSS sanitization on all user input
- [ ] SQL/NoSQL injection protection (using Zod + repository pattern)
- [ ] Password hashing (bcrypt, 12+ chars, complexity)
- [ ] HTTPS enforced in production

---

### 3.2 Environment Variable Setup (2 hours)

**Create production environment template:**

**File:** `.env.production.template`

```bash
# ============================================================================
# PRODUCTION ENVIRONMENT VARIABLES
# ============================================================================
# NEVER commit this file with real values!
# Copy to .env.production and fill in real values

# Database (REQUIRED)
MONGODB_URI=mongodb+srv://user:CHANGE_ME@cluster.mongodb.net/petty-prophecies?retryWrites=true&w=majority

# Authentication (REQUIRED - Generate with: openssl rand -base64 32)
JWT_SECRET=CHANGE_ME_TO_SECURE_RANDOM_STRING_32_PLUS_CHARS

# Email Service (REQUIRED - Get from resend.com)
RESEND_API_KEY=re_CHANGE_ME
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Rate Limiting (REQUIRED for production - Get from upstash.com)
UPSTASH_REDIS_REST_URL=https://CHANGE_ME.upstash.io
UPSTASH_REDIS_REST_TOKEN=CHANGE_ME

# Optional - AI Readings
XAI_API_KEY=CHANGE_ME_IF_YOU_WANT_AI_READINGS

# Optional - Error Tracking (Get from sentry.io)
NEXT_PUBLIC_SENTRY_DSN=https://CHANGE_ME@sentry.io/CHANGE_ME

# Environment
NODE_ENV=production
LOG_LEVEL=info
```

**Verification script:**

**File:** `scripts/verify-env.sh`

```bash
#!/bin/bash
echo "Checking required environment variables..."

required_vars=(
  "MONGODB_URI"
  "JWT_SECRET"
  "RESEND_API_KEY"
  "NEXT_PUBLIC_APP_URL"
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
)

missing=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -ne 0 ]; then
  echo "❌ Missing required environment variables:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

echo "✅ All required environment variables are set"

# Check JWT secret length
if [ ${#JWT_SECRET} -lt 32 ]; then
  echo "⚠️  WARNING: JWT_SECRET should be at least 32 characters"
fi

# Check MongoDB URI format
if [[ ! $MONGODB_URI =~ ^mongodb ]]; then
  echo "❌ MONGODB_URI must start with 'mongodb://' or 'mongodb+srv://'"
  exit 1
fi

echo "✅ Environment validation passed"
```

---

### 3.3 Final Testing (4 hours)

#### E2E Test Suite

**Create:** `__tests__/e2e/user-flow.test.ts`

```typescript
/**
 * E2E Test: Complete User Journey
 * Tests the entire application flow from registration to reading
 */

import { chromium, Browser, Page } from 'playwright'

describe('E2E: Complete User Flow', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await chromium.launch()
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
  })

  afterEach(async () => {
    await page.close()
  })

  it('should complete full user journey', async () => {
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'SecurePass123!'
    const testUsername = `user${Date.now()}`

    // 1. Register
    await page.goto('http://localhost:3000')
    await page.click('text=Register')
    await page.fill('input[name="username"]', testUsername)
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard')

    // 2. Get a tarot reading
    await page.click('text=New Reading')
    await page.selectOption('select[name="spreadType"]', 'Maybe It\'s Not Them, It\'s You')
    await page.click('button:has-text("Get Reading")')

    // Wait for reading to load
    await page.waitForSelector('text=Your Reading')

    // 3. Rate the reading
    await page.click('[aria-label="Rate 5 stars"]')
    await page.waitForSelector('text=Thank you for rating')

    // 4. View reading history
    await page.click('text=My Readings')
    await expect(page.locator('text=Maybe It\'s Not Them, It\'s You')).toBeVisible()

    // 5. Logout
    await page.click('text=Logout')
    await page.waitForURL('**/')
  })

  it('should handle password reset flow', async () => {
    // ... password reset E2E test
  })
})
```

**Manual testing checklist:**

```markdown
## Manual Test Checklist

### Authentication
- [ ] Register new user (receive welcome email)
- [ ] Login with new user
- [ ] Logout
- [ ] Login again
- [ ] Try invalid credentials (should fail)
- [ ] Forgot password (receive email)
- [ ] Reset password with token
- [ ] Login with new password

### Tarot Readings
- [ ] Create reading (without AI)
- [ ] Create reading (with AI - if XAI_API_KEY set)
- [ ] Rate reading (1-5 stars)
- [ ] View reading history
- [ ] Pagination works (if 10+ readings)

### Security
- [ ] Try to access /api/user/readings without login (should fail 401)
- [ ] Try CSRF attack (should fail 403)
- [ ] Try XSS in username field (should be sanitized)
- [ ] Hit rate limit (make 21 reading requests rapidly - should get 429)

### Error Handling
- [ ] Intentionally trigger 404 (go to /nonexistent)
- [ ] Check error is logged to Sentry
- [ ] Trigger 500 error (should show friendly error page)

### Performance
- [ ] Page load < 3 seconds
- [ ] API response < 500ms (without AI)
- [ ] Database queries use indexes (check MongoDB Atlas Performance tab)

### Accessibility
- [ ] Keyboard navigation works (Tab through forms)
- [ ] Screen reader announces errors
- [ ] Form labels properly associated
- [ ] Focus visible on all interactive elements
```

---

### 3.4 Deployment Configuration (2 hours)

#### Vercel Deployment

**File:** `vercel.json` (update)

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "JWT_SECRET": "@jwt_secret",
    "RESEND_API_KEY": "@resend_api_key",
    "NEXT_PUBLIC_APP_URL": "@app_url",
    "UPSTASH_REDIS_REST_URL": "@upstash_url",
    "UPSTASH_REDIS_REST_TOKEN": "@upstash_token",
    "NEXT_PUBLIC_SENTRY_DSN": "@sentry_dsn",
    "XAI_API_KEY": "@xai_key"
  },
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

**Deployment script:**

**File:** `scripts/deploy.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment to production..."

# 1. Check environment
echo "📋 Checking environment variables..."
./scripts/verify-env.sh

# 2. Run tests
echo "🧪 Running tests..."
npm run test:ci

# 3. Build
echo "🔨 Building application..."
npm run build

# 4. Deploy to Vercel
echo "☁️  Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🔍 Monitor at: https://vercel.com/your-project/deployments"
echo "📊 Sentry: https://sentry.io/organizations/your-org/projects/your-project"
```

---

## ✅ CHECKPOINT 4: Production Ready! (ETA: 10 hours from Checkpoint 3)

At this point:
- ✅ Security audit complete
- ✅ Environment variables configured
- ✅ E2E tests passing
- ✅ Deployment scripts ready
- ✅ **READY FOR PRODUCTION DEPLOYMENT** 🎉

---

## 📊 Summary & Timeline

### Total Estimated Time: 40-50 hours (1 week intensive)

| Phase | Duration | Critical | Description |
|-------|----------|----------|-------------|
| **Phase 0** | 2-3h | 🔴 YES | Fix build, tests, accessibility |
| **Phase 1** | 12-16h | 🔴 YES | Integrate v2 middleware, cookie auth |
| **Phase 2** | 12-16h | 🟡 HIGH | Infrastructure (Redis, monitoring, logging) |
| **Phase 3** | 8-12h | 🟢 MED | Final prep, testing, deployment |

### Progress Tracking

Create GitHub issues for each phase:

```bash
# Phase 0
gh issue create --title "🔴 CRITICAL: Fix build error" --label "p0,bug" --body "..."
gh issue create --title "🔴 Fix 30 failing tests" --label "p0,testing" --body "..."

# Phase 1
gh issue create --title "🔴 Migrate to httpOnly cookie auth" --label "p0,security" --body "..."
gh issue create --title "🔴 Integrate CSRF protection" --label "p0,security" --body "..."

# Phase 2
gh issue create --title "🟡 Setup Upstash Redis" --label "p1,infrastructure" --body "..."
gh issue create --title "🟡 Add Sentry monitoring" --label "p1,infrastructure" --body "..."

# Phase 3
gh issue create --title "🟢 E2E testing" --label "p2,testing" --body "..."
gh issue create --title "🟢 Deployment automation" --label "p2,devops" --body "..."
```

---

## 🎯 Success Criteria

Before marking this plan complete, verify:

### Build & Tests
- [ ] `npm run build` succeeds with 0 errors
- [ ] `npm run test:ci` shows 503/503 tests passing (100%)
- [ ] `npm run lint` has 0 errors (warnings OK)

### Security
- [ ] No JWT tokens in localStorage
- [ ] All API routes use httpOnly cookies
- [ ] CSRF protection on all POST/PUT/DELETE
- [ ] Rate limiting active (test with 21 rapid requests)
- [ ] Input validation on all endpoints (Zod)
- [ ] XSS sanitization working (test with `<script>alert('xss')</script>`)

### Infrastructure
- [ ] Upstash Redis connected and working
- [ ] Sentry receiving errors
- [ ] Pino logger writing to stdout (not console)
- [ ] Database indexes created (verify in MongoDB Atlas)
- [ ] All environment variables set in Vercel

### Testing
- [ ] Unit tests: 100% passing
- [ ] Integration tests: 100% passing
- [ ] E2E tests: Complete user journey works
- [ ] Manual testing checklist: 100% complete

### Documentation
- [ ] `.env.production.template` created
- [ ] Deployment guide updated
- [ ] API documentation complete
- [ ] Migration guide written
- [ ] Monitoring setup documented

### Performance
- [ ] Page load < 3 seconds
- [ ] API response < 500ms
- [ ] Database queries < 100ms (check Atlas Performance)
- [ ] Lighthouse score > 90

---

## 📚 Additional Resources

All documentation created during audits:
- `CODE_REVIEW_REPORT.md` - Detailed code review (500+ lines)
- `TECHNICAL_DEBT_AUDIT.md` - Complete debt analysis
- `TEST_FAILURE_ANALYSIS.md` - Test failure root causes
- `PARALLEL_AGENT_EXECUTION_REPORT.md` - Agent implementation summary
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- `docs/API.md` - Complete API reference
- `docs/MIGRATION_GUIDE.md` - Migration strategies
- `docs/DATABASE_INDEXES.md` - Database optimization

---

## 🚀 Let's Ship It!

**You are here:** Phase 0 - Emergency Fixes

**Next step:** Fix the build error (5 minutes)

```bash
# 1. Fix the import
vim src/pages/api/auth/forgot-password.ts
# Change line 118: EmailService → email

# 2. Verify
npm run build

# 3. Continue with test fixes...
```

Good luck! This plan will get you to production in 1 week of focused work. 💪

---

**Questions?** Check the detailed reports in:
- `/CODE_REVIEW_REPORT.md`
- `/TECHNICAL_DEBT_AUDIT.md`
- `/TEST_FAILURE_ANALYSIS.md`

**Ready to start?** Begin with Phase 0 step 1: Fix the build error!
