# Copilot Task List — Passive-Aggressive Tarot

**App completion estimate: ~65% production-ready**

Core features work. Auth, readings, history, UI, ratings — all functional.
What's left is security hardening, missing flows, and production infrastructure.
Do NOT deploy until at minimum the CRITICAL SECURITY tasks are done.

---

## HOW TO USE THIS FILE

Each task below is atomic — one focused change per task. Work top-to-bottom within each section.
Tasks marked with file paths tell you exactly where to make changes.

---

## 🔴 CRITICAL SECURITY — Must complete before any production deployment

### TASK-001: Move JWT from localStorage to httpOnly cookies — Backend
**Files:** `src/pages/api/auth/[...auth].ts`

On successful login, set an httpOnly cookie instead of returning the token in the response body:
```typescript
res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`)
res.status(200).json({ message: 'Login successful' })
```
On logout, clear the cookie:
```typescript
res.setHeader('Set-Cookie', 'token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0')
res.status(200).json({ message: 'Logged out' })
```

---

### TASK-002: Move JWT from localStorage to httpOnly cookies — Auth middleware
**Files:** `src/middleware/auth.ts`

Update `authMiddleware` to read token from cookies instead of Authorization header:
```typescript
import { parse } from 'cookie'

const cookies = parse(req.headers.cookie || '')
const token = cookies.token
```
Remove the `req.headers.authorization?.split(' ')[1]` line.

---

### TASK-003: Move JWT from localStorage to httpOnly cookies — Frontend cleanup
**Files:** `src/components/Login.tsx`, `src/components/TarotReading.tsx`, `src/components/UserDashboard.tsx`, `lib/AuthContext.tsx`, `src/contexts/AuthContext.tsx` (if it still exists)

Remove all `localStorage.getItem('token')` and `localStorage.setItem('token', ...)` calls.
Cookies are sent automatically with fetch requests — no manual token handling needed.

Update `AuthContext`:
- Remove `login(token)` parameter — login now just sets `isAuthenticated(true)`
- Remove `localStorage.removeItem('token')` from logout
- On mount, check auth status via a GET `/api/auth/me` endpoint instead of checking localStorage

Create `/api/auth/me` endpoint that reads the httpOnly cookie and returns `{ userId, isAuthenticated: true }` or 401.

---

### TASK-004: Add CSRF protection
**Files:** `src/middleware/auth.ts` or new `src/middleware/csrf.ts`, all POST/PUT API routes

Install: `npm install csrf`

Create a CSRF middleware:
```typescript
import csrf from 'csrf'
const tokens = new csrf()

export function withCsrf(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method || '')) {
      const secret = process.env.CSRF_SECRET
      if (!secret) throw new Error('CSRF_SECRET not set')
      const token = req.headers['x-csrf-token'] as string
      if (!tokens.verify(secret, token)) {
        return res.status(403).json({ message: 'Invalid CSRF token' })
      }
    }
    return handler(req, res)
  }
}
```

Add `CSRF_SECRET` to `.env.example`. Wrap all POST/PUT handlers with `withCsrf`.

Frontend must fetch a CSRF token from a new `GET /api/auth/csrf` endpoint and send it as `X-CSRF-Token` header on mutations.

---

### TASK-005: Add input sanitization to auth registration
**Files:** `src/pages/api/auth/[...auth].ts`

Install: `npm install xss`

Replace the current bare field usage with Zod + XSS sanitization (Zod is already in package.json):
```typescript
import { z } from 'zod'
import xss from 'xss'

const RegisterSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).transform(v => xss(v)),
  email: z.string().email().max(255).toLowerCase().transform(v => xss(v)),
  password: z.string()
    .min(12)
    .regex(/(?=.*[a-z])/)
    .regex(/(?=.*[A-Z])/)
    .regex(/(?=.*\d)/)
    .regex(/(?=.*[@$!%*?&])/),
})

const LoginSchema = z.object({
  email: z.string().email().transform(v => xss(v)),
  password: z.string().min(1),
})
```

Replace manual field checks with `Schema.safeParse(req.body)`. Return 400 with validation errors on failure.

---

### TASK-006: Add password reset model
**Files:** new file `src/models/PasswordReset.ts`

```typescript
import mongoose from 'mongoose'

const passwordResetSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
})

export const PasswordReset = mongoose.models.PasswordReset ||
  mongoose.model('PasswordReset', passwordResetSchema)
```

---

### TASK-007: Add forgot-password API endpoint
**Files:** new file `src/pages/api/auth/forgot-password.ts`

- Accept POST with `{ email }`
- Look up user by email; if not found return 200 with generic message (don't reveal user existence)
- Generate `crypto.randomBytes(32).toString('hex')` as token
- Save to PasswordReset collection with 1-hour expiry
- Call `sendPasswordResetEmail(email, token)` (implemented in TASK-009)
- Return 200 with generic message

---

### TASK-008: Add reset-password API endpoint
**Files:** new file `src/pages/api/auth/reset-password.ts`

- Accept POST with `{ token, newPassword }`
- Validate newPassword meets complexity requirements (12+ chars, special char, etc.)
- Find PasswordReset record where token matches and `expiresAt > now`
- If not found: return 400 "Invalid or expired token"
- Find user, set `user.password = newPassword` (pre-save hook hashes it)
- Delete all PasswordReset records for that userId
- Return 200

---

### TASK-009: Add email service
**Files:** new file `src/services/email.ts`

Install: `npm install resend`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
  await resend.emails.send({
    from: 'Passive-Aggressive Tarot <noreply@yourdomain.com>',
    to: email,
    subject: 'Password Reset (Since You Forgot Again)',
    html: `<p>Someone requested a password reset. If that someone is you, click below:</p>
           <a href="${resetUrl}">Reset Password</a>
           <p>Link expires in 1 hour. Try not to forget your new password immediately.</p>`,
  })
}
```

Add `RESEND_API_KEY` and `NEXT_PUBLIC_APP_URL` to `.env.example`.

---

### TASK-010: Add forgot/reset password UI
**Files:** new `src/components/ForgotPassword.tsx`, new `src/components/ResetPassword.tsx`, update `src/components/Login.tsx`

- Add "Forgot password?" link to the Login form
- `ForgotPassword` component: email input form that POSTs to `/api/auth/forgot-password`
- `ResetPassword` component: reads `?token=` from URL, shows new password + confirm form, POSTs to `/api/auth/reset-password`
- Wire these into the app routing / HomePage state machine

---

## 🟠 HIGH PRIORITY — Complete before scaling or public launch

### TASK-011: Add database indexes
**Files:** `src/models/Reading.ts`, `src/models/User.ts`

Add indexes to prevent full collection scans:
```typescript
// Reading.ts — add to schema options:
readingSchema.index({ userId: 1, createdAt: -1 })

// User.ts — already has unique on email/username which creates indexes,
// but confirm with: userSchema.index({ email: 1 }, { unique: true })
```

---

### TASK-012: Fix logout endpoint — GET → POST
**Files:** `src/pages/api/auth/[...auth].ts`, `lib/AuthContext.tsx`

The `GET /api/auth/logout` endpoint is a security anti-pattern (GET requests can be triggered by img src, etc.).
Change to `POST /api/auth/logout`. Update the frontend logout call to `fetch('/api/auth/logout', { method: 'POST' })`.

---

### TASK-013: Auto-login after registration
**Files:** `src/components/Register.tsx`, `src/pages/api/auth/[...auth].ts`

Currently the user registers, then must manually log in. After successful registration:
1. Either have the register endpoint return a token (and set httpOnly cookie), OR
2. After register API returns 201, immediately POST to `/api/auth/login` with the same credentials

---

### TASK-014: Fix `any` types in catch blocks
**Files:** `src/pages/api/auth/[...auth].ts`, `src/pages/api/tarot-reading.ts`, `src/utils/api.ts`

Replace `catch (error: any)` with proper typed error handling:
```typescript
import type { MongoError } from '@/src/types/errors'

} catch (error) {
  if (error instanceof Error) {
    const mongoError = error as MongoError
    if (mongoError.code === 11000) {
      // handle duplicate key
    }
  }
  throw error
}
```
`MongoError` interface already exists in `src/types/errors.ts`.

---

### TASK-015: Standardize API error response format
**Files:** all files in `src/pages/api/`

All API error responses should follow one shape:
```typescript
{ success: false, error: { code: string, message: string }, timestamp: string }
```
All success responses:
```typescript
{ success: true, data: T, timestamp: string }
```

Update all `res.status(X).json(...)` calls to use this shape. Use `src/middleware/errorHandler.ts` which already has a handler — just make sure all routes call it.

---

### TASK-016: Replace console logger with Pino
**Files:** `src/utils/logger.ts`

Install: `npm install pino pino-pretty`

Replace the current `console.log` wrapper with:
```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
})

export default logger
```

No other files need to change since they already call `logger.info()`, `logger.error()`, etc.

---

### TASK-017: Complete Sentry integration
**Files:** `src/utils/sentry.ts`, `app/layout.tsx`

Sentry is already imported but not fully configured. Complete setup:
```typescript
// In sentry.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
```

Add `sentry.server.config.ts` and `sentry.edge.config.ts` per Next.js Sentry docs.
Confirm `captureException` is called in the global error handler.

---

### TASK-018: Add token expiry handling to useApiRequest
**Files:** `src/hooks/useApiRequest.ts`

When any API call returns 401, check if it's a token-expired scenario and redirect to login:
```typescript
if (response.status === 401) {
  // Clear auth state and redirect
  // (after TASK-003, this means the httpOnly cookie is expired or invalid)
  window.location.href = '/login?expired=true'
  return
}
```

---

### TASK-019: Enable the skipped auth test suite
**Files:** `__tests__/api/auth.test.ts.skip` → rename to `__tests__/api/auth.test.ts`

Fix the test setup to use `mongodb-memory-server` for in-process MongoDB:
```
npm install --save-dev mongodb-memory-server
```
Set up a `beforeAll` that starts the in-memory server and connects mongoose, `afterAll` to tear it down. Remove all mocking of the actual DB layer since the in-memory server handles it.

---

### TASK-020: Add component integration tests
**Files:** new `__tests__/components/TarotReading.test.tsx`, `__tests__/components/Login.test.tsx`, `__tests__/components/UserDashboard.test.tsx`

For each component:
- Render with required providers (AuthContext, ThemeProvider)
- Test happy path (form submit, loading state, success state)
- Test error path (API failure shows error message)
- Test accessibility (form labels, ARIA attributes, keyboard navigation)

Use `@testing-library/react` and `msw` (Mock Service Worker) to intercept API calls.

---

### TASK-021: Add rate limiting to auth endpoints using 'auth' tier
**Files:** `src/pages/api/auth/[...auth].ts`

The rate limiter now has tiered limits. Auth routes should use the strict `'auth'` tier (10 req/15min):
```typescript
export default rateLimitMiddleware(handler, 'auth')
```
Replace the current `rateLimitMiddleware(handler)` call in the auth route.

---

## 🟡 MEDIUM PRIORITY — Polish and production readiness

### TASK-022: Add HTTP caching headers to GET endpoints
**Files:** `src/pages/api/user/readings.ts`

```typescript
res.setHeader('Cache-Control', 'private, max-age=60, must-revalidate')
```

For POST endpoints that mutate data, add:
```typescript
res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
```

---

### TASK-023: Fix UserDashboard race condition
**Files:** `src/components/UserDashboard.tsx`

There's a potential race condition when page changes fire multiple concurrent fetches.
Fix by tracking the current request and ignoring stale responses:
```typescript
useEffect(() => {
  let cancelled = false
  fetchReadings(page).then(data => {
    if (!cancelled) setReadings(data)
  })
  return () => { cancelled = true }
}, [page])
```

---

### TASK-024: Add missing ARIA attributes
**Files:** `src/components/TarotReading.tsx`, `src/components/UserDashboard.tsx`

- Add `aria-label` to star rating buttons: `aria-label="Rate 3 stars"`
- Add `aria-live="polite"` to the reading result container so screen readers announce new readings
- Add `aria-busy="true"` to loading states
- Ensure the spread select has an associated `<label>`

---

### TASK-025: Remove or wire up unused packages
**Files:** `package.json`

Audit actual usage of:
- `recharts` — if no chart components exist, remove it: `npm uninstall recharts`
- `embla-carousel-react` — if no carousel components exist, remove: `npm uninstall embla-carousel-react`

If these are planned for future features, add a comment in package.json explaining why they're kept.

---

### TASK-026: Add API versioning prefix
**Files:** `next.config.mjs` or via folder restructure

Move all API routes from `/api/` to `/api/v1/` by creating `src/pages/api/v1/` subdirectory.
Add redirects in `next.config.mjs` so old `/api/` paths still work during transition:
```js
async redirects() {
  return [{ source: '/api/:path*', destination: '/api/v1/:path*', permanent: false }]
}
```

---

### TASK-027: Add database migration system
**Files:** new `migrations/` directory, update `package.json`

Install: `npm install migrate-mongo`

Initialize: `npx migrate-mongo init`

Create first migration to add missing indexes:
```
npx migrate-mongo create add-reading-userid-index
```

```typescript
// migrations/YYYYMMDD-add-reading-userid-index.ts
export async function up(db) {
  await db.collection('readings').createIndex({ userId: 1, createdAt: -1 })
}
export async function down(db) {
  await db.collection('readings').dropIndex({ userId: 1, createdAt: -1 })
}
```

---

### TASK-028: Update FIXTHISSHIT.md and DEPLOYMENT_ISSUES.md
**Files:** `FIXTHISSHIT.md`, `DEPLOYMENT_ISSUES.md`

Both files are stubs with empty content. Either:
- Fill them in with current known issues, OR
- Delete them (issues are tracked in TECHNICAL_DEBT.md and this file)

---

### TASK-029: Add Vercel Analytics
**Files:** `app/layout.tsx`

Install: `npm install @vercel/analytics`

```typescript
import { Analytics } from '@vercel/analytics/react'

// In layout.tsx body:
<Analytics />
```

---

### TASK-030: Fix Mongoose type — update cached variable typing
**Files:** `src/utils/database.ts`

After TASK-003's type fix, ensure the `cached` variable never throws on `cached.conn` when `cached` could be undefined:
```typescript
let cached: MongooseCache = global.mongoose ?? { conn: null, promise: null }
if (!global.mongoose) {
  global.mongoose = cached
}
```

---

## ⚪ LOW PRIORITY — Nice to have

### TASK-031: Add common password blocklist
**Files:** `src/utils/validation.ts`

Add check against top 20 common passwords even if they meet complexity requirements:
```typescript
const BLOCKED_PASSWORDS = ['Password123!', 'Passw0rd!', 'Admin123!', ...]
```

---

### TASK-032: Expand tarot card test coverage
**Files:** `__tests__/data/tarotCards.test.ts`

The test file has a TODO to expand from 3 to all 22 Major Arcana cards. Add tests for all cards defined in `src/data/tarotCards.ts`.

---

### TASK-033: Add user preferences
**Files:** new `src/models/UserPreferences.ts`, new `src/pages/api/user/preferences.ts`

Allow users to save:
- Preferred spread
- Dark/light mode preference (server-persisted)
- Notification preferences (when email is implemented)

---

### TASK-034: Show reading cards in UI
**Files:** `src/components/TarotReading.tsx`, `src/components/UserDashboard.tsx`

The `Reading` model stores `cards: [String]` (the card names drawn) but the UI never displays which cards were pulled — only the interpretation text. Show the card names alongside the interpretation.

---

### TASK-035: Add export readings feature
**Files:** `src/components/UserDashboard.tsx`, new `src/pages/api/user/export.ts`

Let users download their reading history as CSV or JSON. Add a "Export readings" button to UserDashboard that calls a new authenticated endpoint returning all readings.

---

## ENVIRONMENT VARIABLES REQUIRED

Update `.env.example` to include all variables needed after completing the tasks above:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/petty-prophecies

# Auth
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
CSRF_SECRET=your-csrf-secret-minimum-32-chars

# AI
XAI_API_KEY=your-xai-api-key

# Email
RESEND_API_KEY=your-resend-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=info

# Monitoring (optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

---

## COMPLETION ESTIMATE

| Section | Tasks | Status |
|---------|-------|--------|
| Critical Security | TASK-001 to TASK-010 | 0/10 complete |
| High Priority | TASK-011 to TASK-021 | 3/11 complete* |
| Medium Priority | TASK-022 to TASK-030 | 0/9 complete |
| Low Priority | TASK-031 to TASK-035 | 0/5 complete |

*TASK-011 (DB indexes), TASK-014 (any types), TASK-021 (auth rate limiting) are partially done from previous session.

**Minimum viable for production:** Complete TASK-001 through TASK-012.

**Fully production-ready:** Complete TASK-001 through TASK-021.
