# Technical Debt Catalog - Passive-Aggressive Tarot

**Generated:** 2025-11-05
**Version:** 1.1.0
**Total Issues:** 78 (9 Critical, 36 High, 29 Medium, 4 Low)
**Includes:** 68 Original Code Review Issues + 10 Deployment Shortcuts

---

## Table of Contents
1. [Critical Security Issues](#critical-security-issues)
2. [High Priority Issues](#high-priority-issues)
3. [Medium Priority Issues](#medium-priority-issues)
4. [Low Priority Issues](#low-priority-issues)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Estimated Effort](#estimated-effort)

---

## Critical Security Issues (7)

### SEC-001: Hardcoded JWT Secret Fallback
**Severity:** 🔴 Critical
**Location:** `src/middleware/auth.ts:4`
**Impact:** Allows authentication to work with known default secret, compromising all user sessions

**Current Code:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
```

**Proposed Solution:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set")
}
```

**Effort:** 5 minutes
**Priority:** Fix immediately before any deployment

---

### SEC-002: JWT Tokens Stored in localStorage (XSS Vulnerable)
**Severity:** 🔴 Critical
**Location:**
- `src/contexts/AuthContext.tsx:23, 28`
- `src/components/TarotReading.tsx:52, 75`
- `src/components/UserDashboard.tsx:31`

**Impact:** JWT tokens can be stolen via XSS attacks, leading to account takeover

**Current Code:**
```typescript
localStorage.setItem("token", token)
const token = localStorage.getItem("token")
```

**Proposed Solution:**

**Step 1:** Update backend to use httpOnly cookies
```typescript
// In /api/auth/login
res.setHeader('Set-Cookie', [
  `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
])
res.status(200).json({ message: "Login successful" })
```

**Step 2:** Update frontend to remove localStorage usage
```typescript
// Remove all localStorage.setItem/getItem("token") calls
// Cookies will be sent automatically with fetch requests
```

**Step 3:** Add CSRF protection
```typescript
// Install: npm install csrf
import csrf from 'csrf'
const tokens = new csrf()

// Generate token on GET requests
const csrfToken = tokens.create(secret)

// Validate on POST/PUT/DELETE requests
const valid = tokens.verify(secret, csrfToken)
```

**Effort:** 4-6 hours
**Priority:** Must fix before production deployment

---

### SEC-003: Missing CSRF Protection
**Severity:** 🔴 Critical
**Location:** All POST/PUT endpoints
**Impact:** Application vulnerable to cross-site request forgery

**Proposed Solution:**
```typescript
// Install: npm install @edge-csrf/nextjs
import { createCsrfProtect } from '@edge-csrf/nextjs'

const csrfProtect = createCsrfProtect({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
  },
})

// Middleware wrapper
export function withCsrf(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const csrfError = await csrfProtect(req, res)
    if (csrfError) {
      return res.status(403).json({ message: 'Invalid CSRF token' })
    }
    return handler(req, res)
  }
}

// Usage
export default withCsrf(authMiddleware(handler))
```

**Effort:** 3-4 hours
**Priority:** Required for production

---

### SEC-004: Weak Email Validation
**Severity:** 🔴 Critical
**Location:** `src/utils/validation.ts:7`
**Impact:** Allows invalid email addresses, potential for injection attacks

**Current Code:**
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

**Proposed Solution:**
```typescript
// Use Zod (already in dependencies)
import { z } from 'zod'

export const emailSchema = z.string().email().min(5).max(255)

export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}
```

**Effort:** 30 minutes
**Priority:** Fix before allowing user registrations

---

### SEC-005: No Password Reset Mechanism
**Severity:** 🔴 Critical
**Location:** Missing feature
**Impact:** Users cannot recover accounts, leading to support burden and frustration

**Proposed Solution:**

**Step 1:** Create password reset schema
```typescript
// src/models/PasswordReset.ts
import mongoose from 'mongoose'

interface IPasswordReset extends mongoose.Document {
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

const passwordResetSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
})

export const PasswordReset = mongoose.model<IPasswordReset>('PasswordReset', passwordResetSchema)
```

**Step 2:** Create forgot-password endpoint
```typescript
// src/pages/api/auth/forgot-password.ts
import crypto from 'crypto'
import { PasswordReset } from '@/src/models/PasswordReset'
import { User } from '@/src/models/User'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email } = req.body
  const user = await User.findOne({ email })

  if (!user) {
    // Don't reveal if user exists
    return res.status(200).json({ message: 'If email exists, reset link sent' })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await PasswordReset.create({
    userId: user._id,
    token,
    expiresAt,
  })

  // TODO: Send email with reset link
  // await sendPasswordResetEmail(email, token)

  res.status(200).json({ message: 'If email exists, reset link sent' })
}
```

**Step 3:** Create reset-password endpoint
```typescript
// src/pages/api/auth/reset-password.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { token, newPassword } = req.body

  const resetRequest = await PasswordReset.findOne({
    token,
    expiresAt: { $gt: new Date() },
  })

  if (!resetRequest) {
    return res.status(400).json({ message: 'Invalid or expired token' })
  }

  const user = await User.findById(resetRequest.userId)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  user.password = newPassword // Will be hashed by pre-save hook
  await user.save()
  await PasswordReset.deleteMany({ userId: user._id })

  res.status(200).json({ message: 'Password reset successful' })
}
```

**Effort:** 6-8 hours (including email integration)
**Priority:** Essential for production

---

### SEC-006: No Input Sanitization Before Database
**Severity:** 🔴 Critical
**Location:** `src/pages/api/auth/[...auth].ts:30-38`
**Impact:** Potential NoSQL injection attacks

**Proposed Solution:**
```typescript
// Install: npm install xss
import xss from 'xss'
import { z } from 'zod'

const RegisterSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .transform(val => xss(val)),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .toLowerCase()
    .transform(val => xss(val)),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain number')
    .regex(/(?=.*[@$!%*?&])/, 'Password must contain special character'),
})

async function handleRegister(req: NextApiRequest, res: NextApiResponse) {
  const validation = RegisterSchema.safeParse(req.body)

  if (!validation.success) {
    throw new ValidationError(validation.error.errors.map(e => e.message).join(', '))
  }

  const { username, email, password } = validation.data
  // Now safe to use
}
```

**Effort:** 2-3 hours
**Priority:** Critical for production

---

### SEC-007: Weak Password Requirements
**Severity:** 🔴 Critical
**Location:** `src/utils/validation.ts:18`
**Impact:** Weak passwords make accounts vulnerable to brute force

**Current Code:**
```typescript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
```

**Proposed Solution:**
```typescript
// Require: 12+ chars, uppercase, lowercase, digit, special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{12,}$/

export const validatePassword = (password: string): boolean => {
  // Check length
  if (password.length < 12) return false

  // Check complexity
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSpecial = /[@$!%*?&]/.test(password)

  return hasLower && hasUpper && hasDigit && hasSpecial
}

// Also check against common passwords
const COMMON_PASSWORDS = ['password123', 'Password123!', ...]
if (COMMON_PASSWORDS.includes(password)) {
  return false
}
```

**Effort:** 1 hour
**Priority:** Must fix before production

---

## High Priority Issues (30)

### QUAL-001: Duplicate AuthContext in Two Locations
**Severity:** 🟠 High
**Location:**
- `src/contexts/AuthContext.tsx` (47 lines)
- `lib/AuthContext.tsx` (45 lines)

**Impact:** Maintenance burden, risk of inconsistency

**Proposed Solution:**
```bash
# Delete the duplicate
rm src/contexts/AuthContext.tsx

# Update imports in src/ files
find src -type f -name "*.tsx" -exec sed -i 's|from "../contexts/AuthContext"|from "@/lib/AuthContext"|g' {} +
```

**Effort:** 15 minutes
**Priority:** Clean up before further development

---

### QUAL-002: Multiple `any` Type Usage
**Severity:** 🟠 High
**Location:** Multiple files (20+ instances)

**Impact:** Breaks TypeScript type safety

**Proposed Solution:**

Create proper error types:
```typescript
// src/types/errors.ts
export interface MongoError extends Error {
  code?: number
  keyPattern?: Record<string, any>
  keyValue?: Record<string, any>
}

export interface ApiError extends Error {
  status?: number
  code?: string
}

export interface ValidationError extends Error {
  field?: string
  value?: any
}
```

Replace all `any` with proper types:
```typescript
// ❌ Before
catch (error: any) {
  if (error.code === 11000) { ... }
}

// ✅ After
catch (error) {
  const mongoError = error as MongoError
  if (mongoError.code === 11000) { ... }
}
```

**Effort:** 3-4 hours
**Priority:** Improves code quality significantly

---

### QUAL-003: Inconsistent Error Handling
**Severity:** 🟠 High
**Location:** All API endpoints

**Impact:** Unpredictable error responses

**Proposed Solution:**

Create standardized error handler:
```typescript
// src/middleware/errorHandler.ts
export interface StandardApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  timestamp: string
}

export function handleApiError(error: unknown, res: NextApiResponse) {
  const timestamp = new Date().toISOString()

  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details,
      },
      timestamp,
    })
  }

  if (error instanceof AuthenticationError) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: error.message,
      },
      timestamp,
    })
  }

  // Generic error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    timestamp,
  })
}
```

**Effort:** 4-5 hours
**Priority:** Essential for API consistency

---

### QUAL-004-030: [Additional 27 High Priority Issues]

**Note:** For brevity, the remaining high-priority issues are summarized. Full details available in code review document.

- Missing JSDoc comments (QUAL-004)
- Loose type definitions (QUAL-005)
- Error swallowing in components (QUAL-006)
- Inefficient cache key generation (PERF-001)
- No database indexes (PERF-002)
- Race conditions in UserDashboard (BUG-001)
- Unhandled null/undefined (BUG-002)
- Missing keyboard navigation (ACC-001)
- Missing integration tests (TEST-001)
- Missing API tests (TEST-002)
- Missing component tests (TEST-003)
- DRY violation - token storage (REFAC-001)
- Magic numbers throughout (REFAC-002)
- No API input validation (API-001)
- Inconsistent error responses (API-002)
- Missing database indexes (DB-001)
- Missing API documentation (DOC-001)

---

## Medium Priority Issues (27)

### SEC-008: Missing Validation on API Parameters
**Severity:** 🟡 Medium
**Location:** `src/pages/api/user/readings.ts:11`

**Proposed Solution:**
```typescript
const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page as string) || 1))
const limit = Math.max(1, Math.min(100, Number.parseInt(req.query.limit as string) || 10))
```

**Effort:** 15 minutes

---

### SEC-009: No Token Expiry Handling
**Severity:** 🟡 Medium
**Location:** All API calls

**Proposed Solution:**
```typescript
// In useApiRequest hook
if (response.status === 401) {
  const data = await response.json()
  if (data.code === 'TOKEN_EXPIRED') {
    // Clear auth and redirect
    logout()
    router.push('/login?expired=true')
  }
}
```

**Effort:** 2 hours

---

### SEC-010: Rate Limiting Too Permissive
**Severity:** 🟡 Medium
**Location:** `src/middleware/rateLimit.ts:6-7`

**Proposed Solution:**
```typescript
const RATE_LIMITS = {
  auth: { max: 10, window: 15 * 60 * 1000 },      // 10 per 15min for auth
  general: { max: 50, window: 15 * 60 * 1000 },   // 50 per 15min for general
  reading: { max: 20, window: 15 * 60 * 1000 },   // 20 per 15min for readings
}

export function createRateLimiter(type: keyof typeof RATE_LIMITS) {
  const config = RATE_LIMITS[type]
  return rateLimitMiddleware(config.max, config.window)
}
```

**Effort:** 1 hour

---

### PERF-003: Missing HTTP Caching Headers
**Severity:** 🟡 Medium
**Location:** All API endpoints

**Proposed Solution:**
```typescript
// For GET /api/user/readings
res.setHeader('Cache-Control', 'private, max-age=300, must-revalidate')
res.status(200).json(data)

// For POST /api/tarot-reading
res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
res.setHeader('Pragma', 'no-cache')
res.status(200).json(data)
```

**Effort:** 1 hour

---

### PERF-004: Pagination Not Validated
**Severity:** 🟡 Medium
**Location:** `src/pages/api/user/readings.ts:11-13`

**Proposed Solution:**
```typescript
const MAX_PAGE = 10000
const MAX_LIMIT = 100

const page = Math.min(
  Math.max(1, Number.parseInt(req.query.page as string) || 1),
  MAX_PAGE
)
const limit = Math.min(
  Math.max(1, Number.parseInt(req.query.limit as string) || 10),
  MAX_LIMIT
)
```

**Effort:** 15 minutes

---

### BUG-003-007: [Additional Medium Bugs]
- No token expiry handling (BUG-003)
- Missing error reset in hooks (BUG-004)
- Case sensitivity in validation (BUG-005)
- Incomplete retry handler (BUG-006)

---

### ACC-002-004: [Accessibility Issues]
- Missing focus management (ACC-002)
- Insufficient color contrast (ACC-003)
- Missing ARIA labels (ACC-004)

---

### TEST-004-006: [Testing Gaps]
- Missing validation tests (TEST-004)
- Missing middleware tests (TEST-005)

---

### REFAC-003-005: [Code Improvements]
- Empty catch blocks (REFAC-003)
- Unused dependencies (REFAC-004)
- Incomplete Sentry integration (REFAC-005)

---

### API-003-006: [API Design Issues]
- No API versioning (API-003)
- GET logout should be POST (API-004)
- Missing endpoint docs (API-005)
- No database indexes (API-006)

---

### DOC-002-003: [Documentation]
- Unclear variable names (DOC-002)
- Complex logic not documented (DOC-003)

---

### DEP-001-003: [Dependencies]
- Unused dependencies (DEP-001)
- Incomplete Sentry config (DEP-002)
- Missing type definitions (DEP-003)

---

## Low Priority Issues (4)

### ACC-005: Form Labels Association
**Severity:** ⚪ Low
**Location:** Various forms
**Current Status:** Already correct, consider adding aria-required

**Effort:** 30 minutes

---

### DEP-004: Missing Type Definitions
**Severity:** ⚪ Low
**Location:** Some UI packages

**Effort:** 1 hour

---

## Deployment Shortcuts & Implementation Gaps

**Context:** During the initial "make it deployment-ready" work, several shortcuts were taken to get the build passing and infrastructure in place. These need to be addressed for production quality.

### SHORTCUT-001: Simplified Console-Only Logger
**Severity:** 🟠 High
**Location:** `src/utils/logger.ts`
**What Was Done:** Replaced winston with a simple console.log-based logger to avoid dependencies and get build passing

**Current Implementation:**
```typescript
// Simple console-based logger - no file output, no log rotation, no centralized logging
const wrappedLogger = {
  error: (message: string, meta?: any) => {
    console.error(formatLog("error", message, meta))
  }
}
```

**Production Issues:**
- No log persistence (logs lost on container restart)
- No log aggregation for distributed systems
- Cannot search/analyze logs easily
- No log rotation or storage management
- Using `any` type for metadata

**Proper Solution:**
```bash
npm install pino pino-pretty
```

```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }
    },
  },
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
})

export default logger
```

For production, integrate with:
- **Vercel:** Use Vercel's built-in logging
- **Docker:** Configure log driver (json-file with rotation, or fluentd/gelf)
- **Observability:** Send to Datadog, New Relic, or LogDNA

**Effort:** 2-3 hours
**Priority:** High - Required for production debugging

---

### SHORTCUT-002: In-Memory Rate Limiter (Not Distributed)
**Severity:** 🔴 Critical
**Location:** `src/middleware/rateLimit.ts`
**What Was Done:** Created simple Map-based rate limiter to replace express-rate-limit

**Current Implementation:**
```typescript
// In-memory map - resets on restart, doesn't work across instances
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
```

**Production Issues:**
- **Serverless Incompatible:** Each Lambda/Vercel function has its own memory
- **Multi-Instance Fail:** Load balanced servers have separate rate limit counters
- **Memory Leak:** Map grows indefinitely, no cleanup of old entries
- **Bypass Vulnerability:** Restart server = reset all rate limits

**Proper Solution:**

**For Vercel:**
```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "15 m"),
})

export async function rateLimitMiddleware(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const ip = getIP(req)
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)

    res.setHeader("X-RateLimit-Limit", limit.toString())
    res.setHeader("X-RateLimit-Remaining", remaining.toString())
    res.setHeader("X-RateLimit-Reset", new Date(reset).toISOString())

    if (!success) {
      return res.status(429).json({ error: "Too many requests" })
    }

    return handler(req, res)
  }
}
```

**For Docker:**
```typescript
import Redis from 'ioredis'
import { RateLimiterRedis } from 'rate-limiter-flexible'

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
})

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 100,
  duration: 15 * 60, // 15 minutes
})
```

**Effort:** 4-6 hours (includes Redis/Upstash setup)
**Priority:** Critical - Current implementation doesn't work in production

---

### SHORTCUT-003: In-Memory API Cache (Not Distributed)
**Severity:** 🟠 High
**Location:** `src/utils/api.ts:12`
**What Was Done:** Simple object-based cache for API responses

**Current Implementation:**
```typescript
const cache: { [key: string]: CacheItem<any> } = {}
```

**Production Issues:**
- Same as rate limiter - doesn't work across instances/serverless
- No cache invalidation strategy
- No memory limit (can grow indefinitely)
- Using `any` type

**Proper Solution:**
Either remove caching (Next.js has built-in fetch caching), or use:
- SWR or React Query for client-side caching
- Redis for server-side caching
- Next.js native caching with `fetch()` and revalidation

**Effort:** 2-3 hours
**Priority:** High - Could cause memory issues or cache inconsistency

---

### SHORTCUT-004: Minimal Test Coverage
**Severity:** 🟠 High
**Location:** `__tests__/` directory
**What Was Done:** Jest infrastructure set up, but only 7 test files exist

**Current Test Files:**
- `__tests__/AuthContext.test.tsx`
- `__tests__/api/auth.test.ts`
- `__tests__/errorHandler.test.ts`
- `__tests__/middleware/errorHandler.test.ts`
- `__tests__/data/tarotSpreads.test.ts`
- `__tests__/data/tarotCards.test.ts`
- `__tests__/useApiRequest.test.ts`
- `__tests__/utils/api.test.ts`

**Missing Critical Tests:**
- ❌ Component integration tests (TarotReading, UserDashboard, HomePage)
- ❌ API route E2E tests (actual HTTP requests)
- ❌ Database integration tests with test MongoDB
- ❌ Authentication flow E2E tests
- ❌ Rate limiter tests
- ❌ Form validation tests
- ❌ Error boundary tests
- ❌ Accessibility tests
- ❌ SSR hydration tests

**Coverage Target:** Should be >80% for critical paths

**Proper Solution:**
Add comprehensive test suite (covered in TEST-001 through TEST-006 above)

**Effort:** 20-30 hours
**Priority:** High - Cannot safely refactor without tests

---

### SHORTCUT-005: Global Mongoose Type Using `any`
**Severity:** 🟡 Medium
**Location:** `src/utils/database.ts:14`
**What Was Done:** Used `any` type and eslint-disable to bypass TypeScript

**Current Implementation:**
```typescript
declare global {
  // eslint-disable-next-line no-var
  var mongoose: any
}
```

**Proper Solution:**
```typescript
import type { Connection } from 'mongoose'

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: Connection | null; promise: Promise<Connection> | null } | undefined
}
```

**Effort:** 10 minutes
**Priority:** Medium - Works but not type-safe

---

### SHORTCUT-006: No Database Migration System
**Severity:** 🟡 Medium
**Location:** N/A - Not implemented
**What Was Missing:** Schema changes require manual database updates

**Impact:**
- Cannot safely roll out schema changes
- No version control for database structure
- Risky deployments when models change

**Proper Solution:**
```bash
npm install migrate-mongo
```

Create `migrations/` directory:
```typescript
// migrations/20251105-add-user-email-verification.ts
export async function up(db, client) {
  await db.collection('users').updateMany(
    { emailVerified: { $exists: false } },
    { $set: { emailVerified: false, verificationToken: null } }
  )
}

export async function down(db, client) {
  await db.collection('users').updateMany(
    {},
    { $unset: { emailVerified: "", verificationToken: "" } }
  )
}
```

**Effort:** 3-4 hours (setup + document process)
**Priority:** Medium - Important for future maintenance

---

### SHORTCUT-007: No Email Service Implementation
**Severity:** 🔴 Critical
**Location:** `TECHNICAL_DEBT.md:220` (SEC-005 password reset)
**What Was Missing:** Email functionality documented but not implemented

**Current Code:**
```typescript
// TODO: Send email with reset link
```

**Impact:**
- Cannot implement password reset (security issue)
- Cannot send verification emails
- No user notifications

**Proper Solution:**
Choose email provider:

**Option 1: Resend (Modern, developer-friendly)**
```bash
npm install resend
```

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

  await resend.emails.send({
    from: 'Passive-Aggressive Tarot <noreply@yourdomain.com>',
    to: email,
    subject: 'Password Reset Request (If You Can Remember Requesting It)',
    html: `
      <p>Someone (presumably you) requested a password reset.</p>
      <p><a href="${resetUrl}">Reset your password here</a></p>
      <p>This link expires in 1 hour. Try not to forget this time.</p>
    `,
  })
}
```

**Option 2: SendGrid (Established, scalable)**
```bash
npm install @sendgrid/mail
```

**Effort:** 3-4 hours (provider setup + templates + testing)
**Priority:** Critical - Required for SEC-005 (password reset)

---

### SHORTCUT-008: No Monitoring/Observability
**Severity:** 🟠 High
**Location:** N/A - Not implemented
**What Was Missing:** No error tracking, performance monitoring, or analytics

**Current State:**
- Sentry imported but not fully configured
- No performance metrics
- No user session replay
- No database query monitoring
- No API endpoint analytics

**Proper Solution:**

**Sentry (Already started):**
```typescript
// lib/sentry.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
})
```

**Add Performance Monitoring:**
```bash
npm install @vercel/analytics
```

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Effort:** 4-6 hours
**Priority:** High - Cannot debug production without this

---

### SHORTCUT-009: No Input Validation Library (Zod)
**Severity:** 🟠 High
**Location:** Multiple API routes
**What Was Done:** Manual validation with simple if statements

**Current Implementation:**
```typescript
if (!username || !email || !password) {
  throw new ValidationError("Missing required fields")
}
```

**Impact:**
- Inconsistent validation across endpoints
- No type inference from validation
- Easy to miss edge cases
- No standardized error messages

**Zod Already in Dependencies:** Just not implemented

**Proper Solution:**
```typescript
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
})

async function handleRegister(req: NextApiRequest, res: NextApiResponse) {
  const validation = registerSchema.safeParse(req.body)

  if (!validation.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: validation.error.format(),
    })
  }

  const { username, email, password } = validation.data
  // ... rest of handler
}
```

**Effort:** 4-6 hours (all API routes)
**Priority:** High - Part of API-002 above

---

### SHORTCUT-010: Error Handling Using `any` Type
**Severity:** 🟡 Medium
**Location:** Multiple files
**What Was Done:** Used `catch (error: any)` throughout codebase

**Affected Files:**
- `src/pages/api/auth/[...auth].ts:40`
- `src/pages/api/user/readings.ts:30`
- `src/models/User.ts:24`

**Proper Solution:**
```typescript
// Create proper error type
type MongoError = Error & { code?: number }

try {
  await user.save()
} catch (error) {
  if (error instanceof Error) {
    const mongoError = error as MongoError
    if (mongoError.code === 11000) {
      throw new ValidationError("Username or email already exists")
    }
  }
  throw error
}
```

**Effort:** 1-2 hours
**Priority:** Medium - Part of QUAL-002 above

---

## Summary of Shortcuts

**Total Shortcuts Identified:** 10

**By Priority:**
- 🔴 Critical: 2 (Rate Limiter, Email Service)
- 🟠 High: 6 (Logger, API Cache, Tests, Monitoring, Zod, Error Handling)
- 🟡 Medium: 2 (Mongoose Type, Database Migrations)

**Estimated Total Effort to Address All Shortcuts:** 44-63 hours

**Most Critical for Production:**
1. SHORTCUT-002: Fix rate limiter for distributed systems (6 hours)
2. SHORTCUT-007: Implement email service (4 hours)
3. SHORTCUT-001: Proper logging infrastructure (3 hours)
4. SHORTCUT-008: Set up monitoring/observability (6 hours)

**Quick Wins:**
- SHORTCUT-005: Fix mongoose type (10 min)
- SHORTCUT-009: Implement Zod (already in deps, 4-6 hours for full implementation)

---

## Implementation Roadmap

### Phase 1: Critical Security (Week 1)
**Duration:** 3-4 days
**Must complete before ANY production deployment**

1. SEC-001: Remove JWT secret fallback (5 min)
2. SEC-004: Implement proper email validation (30 min)
3. SEC-007: Strengthen password requirements (1 hour)
4. SEC-006: Add input sanitization (2-3 hours)
5. SEC-002: Migrate to httpOnly cookies (4-6 hours)
6. SEC-003: Implement CSRF protection (3-4 hours)
7. SEC-005: Add password reset flow (6-8 hours)

**Total Effort:** 17-23 hours

---

### Phase 2: High Priority Fixes (Week 2)
**Duration:** 5-7 days

1. QUAL-001: Remove duplicate AuthContext (15 min)
2. QUAL-002: Fix all `any` types (3-4 hours)
3. QUAL-003: Standardize error handling (4-5 hours)
4. PERF-001: Fix cache key generation (1 hour)
5. DB-001: Add database indexes (2 hours)
6. BUG-001: Fix race conditions (2-3 hours)
7. BUG-002: Handle null/undefined properly (2 hours)
8. TEST-001-003: Add critical tests (16-20 hours)
9. API-001-002: Implement Zod validation (4-6 hours)
10. REFAC-001-002: Remove DRY violations (2-3 hours)

**Total Effort:** 37-47 hours

---

### Phase 3: Medium Priority (Week 3-4)
**Duration:** 10-15 days

1. All remaining SEC-008 through SEC-010
2. Performance optimizations (PERF-003, PERF-004)
3. Remaining bug fixes (BUG-003 through BUG-006)
4. Accessibility improvements (ACC-002 through ACC-005)
5. Remaining tests (TEST-004 through TEST-006)
6. Documentation (DOC-001 through DOC-003)
7. API improvements (API-003 through API-006)

**Total Effort:** 40-60 hours

---

### Phase 4: Low Priority & Polish (Ongoing)
**Duration:** Ongoing

1. Code cleanup
2. Performance monitoring
3. Documentation improvements
4. Developer experience enhancements

**Total Effort:** Ongoing

---

## Estimated Effort Summary

| Phase | Duration | Developer Hours | Can Deploy? |
|-------|----------|-----------------|-------------|
| Phase 1 (Critical) | 3-4 days | 17-23 hours | ❌ Not yet |
| Phase 2 (High) | 5-7 days | 37-47 hours | ⚠️ With risk |
| Phase 3 (Medium) | 10-15 days | 40-60 hours | ✅ Yes |
| Phase 4 (Low) | Ongoing | Ongoing | ✅ Yes |

**Minimum to Deploy:** Complete Phase 1 + selected Phase 2 items = ~40-50 hours

---

## Quick Wins (Can Do Today)

These fixes take <30 minutes each and provide immediate value:

1. ✅ Remove JWT secret fallback (SEC-001) - 5 min
2. ✅ Delete duplicate AuthContext (QUAL-001) - 15 min
3. ✅ Add email validation with Zod (SEC-004) - 30 min
4. ✅ Strengthen password requirements (SEC-007) - 30 min
5. ✅ Add pagination validation (PERF-004) - 15 min
6. ✅ Fix non-null assertion (BUG-002) - 10 min

**Total Quick Wins:** ~2 hours, significant security improvement

---

## Blocker Issues for Production

These MUST be fixed before production deployment:

- [ ] SEC-001: JWT secret fallback
- [ ] SEC-002: localStorage → httpOnly cookies
- [ ] SEC-003: CSRF protection
- [ ] SEC-004: Email validation
- [ ] SEC-006: Input sanitization
- [ ] SEC-007: Password requirements
- [ ] TEST-001: Integration tests for auth flow
- [ ] API-002: Standardized error responses

---

## Risk Assessment

**Current Risk Level:** 🔴 **HIGH**

**Risks if deployed without fixes:**
- Account takeover via XSS (SEC-002)
- Authentication bypass (SEC-001)
- CSRF attacks (SEC-003)
- NoSQL injection (SEC-006)
- Weak passwords brute-forced (SEC-007)
- Production failures without test coverage

**Recommendation:** **DO NOT DEPLOY** until Phase 1 is complete

---

## Tracking Progress

Create GitHub issues for each item with labels:
- `security` - Security issues
- `bug` - Bugs
- `performance` - Performance
- `accessibility` - A11y
- `testing` - Test coverage
- `tech-debt` - Technical debt
- `p0` - Critical
- `p1` - High
- `p2` - Medium
- `p3` - Low

---

## Next Steps

1. **Immediate (Today):**
   - Fix quick wins (2 hours)
   - Review this document with team
   - Create GitHub issues for Phase 1

2. **This Week:**
   - Complete Phase 1 (Critical Security)
   - Set up test infrastructure
   - Begin Phase 2 high-priority items

3. **Next 2 Weeks:**
   - Complete Phase 2
   - Begin Phase 3
   - Regular security reviews

4. **Ongoing:**
   - Monitor security advisories
   - Regular dependency updates
   - Continuous testing improvement

---

**Document Maintenance:** Review and update this document monthly

**Last Updated:** 2025-11-05
**Next Review:** 2025-12-05
