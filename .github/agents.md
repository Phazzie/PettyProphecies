# AI Agent Instructions - Passive-Aggressive Tarot

## Project Overview

**Project:** Passive-Aggressive Tarot
**Type:** Full-stack Next.js 14 web application (App Router)
**Purpose:** A tarot reading app with a passive-aggressive personality that provides readings with sass

**Tech Stack:**
- **Frontend:** Next.js 14.2.33, React 18, TypeScript 5, Tailwind CSS 3.4.17
- **Backend:** Next.js API Routes, MongoDB with Mongoose
- **Auth:** JWT with bcrypt password hashing
- **Deployment:** Vercel (primary), Docker (alternative)
- **Testing:** Jest, React Testing Library
- **UI Components:** Radix UI, Shadcn components

---

## Project Structure

```
PettyProphecies/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Homepage (client component)
├── src/
│   ├── components/          # React components
│   │   ├── HomePage.tsx     # Main app component
│   │   ├── TarotReading.tsx # Reading interface
│   │   ├── UserDashboard.tsx # User history
│   │   ├── Login.tsx        # Auth forms
│   │   └── Register.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication state (DEPRECATED - use lib/AuthContext)
│   ├── data/                # Static data
│   │   ├── tarotCards.ts    # 78 card definitions
│   │   └── tarotSpreads.ts  # Spread layouts
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Shared utilities
│   │   └── AuthContext.tsx  # Current auth context
│   ├── middleware/          # API middleware
│   │   ├── auth.ts          # JWT verification
│   │   ├── errorHandler.ts  # Error handling
│   │   └── rateLimit.ts     # Rate limiting (SHORTCUT - see TECHNICAL_DEBT.md)
│   ├── models/              # Mongoose models
│   │   ├── User.ts          # User schema
│   │   └── Reading.ts       # Reading schema
│   ├── pages/api/           # API routes (compatible with App Router)
│   │   ├── auth/[...auth].ts # Login/register/logout
│   │   └── user/readings.ts  # CRUD for readings
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
│       ├── database.ts      # MongoDB connection
│       ├── logger.ts        # Logging (SHORTCUT - see TECHNICAL_DEBT.md)
│       └── validation.ts    # Input validation
├── __tests__/               # Test files (NEEDS EXPANSION)
├── .github/
│   └── workflows/ci-cd.yml  # CI/CD pipeline
├── TECHNICAL_DEBT.md        # **READ THIS FIRST** - 78 documented issues
├── DEPLOYMENT.md            # Deployment guide
└── .env.example             # Environment variable template
```

---

## Critical Documents to Review

**Before making ANY changes, read these:**

1. **TECHNICAL_DEBT.md** - Contains 78 known issues with solutions
   - 9 Critical security issues
   - 36 High priority issues
   - 29 Medium priority issues
   - 10 deployment shortcuts that need addressing

2. **DEPLOYMENT.md** - Deployment procedures for Vercel, Docker, self-hosted

3. **.env.example** - Required environment variables

---

## Architecture Patterns

### Routing Architecture
- **App Router ONLY** - Migrated from mixed Pages/App Router
- Client components marked with `"use client"` directive
- API routes in `src/pages/api/` (compatible with App Router)
- SSR hydration safety via `mounted` state pattern

### Authentication Flow
```
User → Login/Register → JWT generated → Stored in localStorage (⚠️ INSECURE - see SEC-002)
                                      ↓
                        Should be httpOnly cookies (see TECHNICAL_DEBT.md)
```

### Database Pattern
```typescript
// ALWAYS use this pattern for API routes
await connectToDatabase()  // Handles connection pooling

// Models auto-connect via cached connection
const user = await User.findOne({ email })
```

### Error Handling
```typescript
// Use custom error classes
throw new ValidationError("Message")
throw new AuthenticationError("Message")

// API routes wrapped with errorHandler middleware
export default rateLimitMiddleware(errorHandler(handler))
```

---

## Code Conventions

### TypeScript
- **Strict mode enabled** - No implicit any
- **Exception:** Logger/cache use `any` (documented in SHORTCUT-001, SHORTCUT-003)
- Prefer interfaces for objects, types for unions
- Use proper error types, avoid `catch (error: any)`

### React Components
```typescript
// Client component pattern (SSR-safe)
"use client"

export function ComponentName() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <LoadingSpinner />  // Prevent hydration mismatch
  }

  // ... rest of component
}
```

### API Route Pattern
```typescript
import { rateLimitMiddleware } from "@/src/middleware/rateLimit"
import { errorHandler } from "@/src/middleware/errorHandler"
import { connectToDatabase } from "@/src/utils/database"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  // Validate input (TODO: Use Zod - see SHORTCUT-009)
  const { field } = req.body
  if (!field) {
    throw new ValidationError("Missing field")
  }

  // Business logic
  const result = await doSomething()

  res.status(200).json({ data: result })
}

export default rateLimitMiddleware(errorHandler(handler))
```

### Import Paths
- Use `@/` alias for root-level imports
- Use `@/src/` for src directory
- Example: `import { User } from "@/src/models/User"`

---

## Testing Strategy

### Current State
- Jest configured with Next.js
- Only 8 test files exist (see SHORTCUT-004)
- **Need 80%+ coverage before production**

### Test Pattern
```typescript
import { render, screen } from "@testing-library/react"
import { ComponentName } from "@/src/components/ComponentName"

describe("ComponentName", () => {
  it("should render correctly", () => {
    render(<ComponentName />)
    expect(screen.getByText("Expected Text")).toBeInTheDocument()
  })
})
```

### Run Tests
```bash
npm run test        # Watch mode
npm run test:ci     # CI mode
```

---

## Known Issues & Shortcuts

**⚠️ CRITICAL: Review TECHNICAL_DEBT.md before deploying**

### Top Blockers for Production
1. **SEC-002:** JWT in localStorage (XSS vulnerable) → Need httpOnly cookies
2. **SEC-003:** No CSRF protection
3. **SHORTCUT-002:** Rate limiter doesn't work in serverless/distributed
4. **SHORTCUT-007:** No email service (blocks password reset)

### Quick Wins (< 10 min each)
- SHORTCUT-005: Fix mongoose type from `any` to proper type
- SEC-001: Remove JWT secret fallback

---

## Common Tasks

### Add New API Route
1. Create file in `src/pages/api/`
2. Import middleware: `errorHandler`, `rateLimitMiddleware`
3. Import `connectToDatabase`
4. Wrap handler: `export default rateLimitMiddleware(errorHandler(handler))`
5. Add tests in `__tests__/api/`
6. Update TECHNICAL_DEBT.md if shortcuts taken

### Add New Component
1. Create file in `src/components/`
2. Add `"use client"` if uses hooks
3. Implement `mounted` state if SSR-sensitive
4. Use Tailwind for styling
5. Import from Radix UI for interactive elements
6. Add tests in `__tests__/components/`

### Add New Database Model
1. Create schema in `src/models/`
2. Use mongoose.model() pattern from existing models
3. Add indexes for queried fields
4. Consider creating migration (see SHORTCUT-006)

### Fix Security Issue
1. Reference TECHNICAL_DEBT.md for the specific issue
2. Follow the "Proposed Solution" code example
3. Run build: `npm run build`
4. Run tests: `npm run test:ci`
5. Update TECHNICAL_DEBT.md to mark as fixed

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Start MongoDB (Docker)
docker run -d -p 27017:27017 mongo:7

# Start dev server
npm run dev
```

### Before Committing
```bash
npm run build     # Ensure no TypeScript errors
npm run lint      # Check linting
npm run test:ci   # Run all tests
```

### Deployment
- **Vercel:** Main deployment target
  - Requires: MongoDB Atlas, Upstash Redis (for rate limiting)
  - See DEPLOYMENT.md for full guide
- **Docker:** Alternative deployment
  - Includes MongoDB in docker-compose
  - See DEPLOYMENT.md for commands

---

## AI Agent Guidelines

### General Approach
1. **Always read TECHNICAL_DEBT.md first** when starting work
2. **Check for existing issues** before creating new code
3. **Follow established patterns** from existing code
4. **Write tests** for all new features
5. **Update documentation** when making changes
6. **Use parallel operations** when possible (multiple tool calls)

### When Adding Features
- Check if it's already in TECHNICAL_DEBT.md as a TODO
- Follow the TypeScript/React patterns above
- Add both unit and integration tests
- Update .env.example if new env vars needed
- Document in TECHNICAL_DEBT.md if taking shortcuts

### When Fixing Bugs
- Search TECHNICAL_DEBT.md to see if it's documented
- If documented, use the "Proposed Solution"
- If not documented, add it to TECHNICAL_DEBT.md
- Write test to prevent regression
- Update TECHNICAL_DEBT.md to mark as fixed

### When Refactoring
- **Do not refactor without tests** (see SHORTCUT-004)
- Write tests first if they don't exist
- Refactor in small, safe increments
- Run build + tests after each change
- Update type definitions if needed

### Security Considerations
- **Never** commit secrets or API keys
- **Always** validate user input
- **Never** trust client-side data
- **Always** use parameterized queries (Mongoose handles this)
- **Review** SEC-001 through SEC-010 before any auth changes

---

## Passive-Aggressive Tone

This app has a sarcastic, passive-aggressive personality. When adding new:
- Error messages → Add sass
- Loading states → "Oh, you're making me work again?"
- Success messages → Backhanded compliments
- Empty states → Judgy remarks

**Examples from existing code:**
```typescript
"Logging in again? Don't you have anything better to do?"
"You haven't had any readings yet. Maybe you're avoiding the truth?"
"Too many requests from this IP, please try again later. The universe isn't ready for your enthusiasm."
```

---

## Build & Deploy Checklist

- [ ] All TypeScript errors resolved (`npm run build`)
- [ ] All tests passing (`npm run test:ci`)
- [ ] No new security vulnerabilities (`npm audit`)
- [ ] Environment variables documented in .env.example
- [ ] TECHNICAL_DEBT.md updated with any shortcuts
- [ ] Critical security issues (SEC-001 to SEC-007) addressed
- [ ] Rate limiter configured for production (SHORTCUT-002)
- [ ] Email service configured (SHORTCUT-007)
- [ ] Monitoring/logging configured (SHORTCUT-008)

---

## Getting Help

- **Code Review Issues:** See TECHNICAL_DEBT.md sections SEC-*, QUAL-*, PERF-*, BUG-*
- **Deployment Issues:** See DEPLOYMENT.md
- **Architecture Questions:** Review this file and existing code patterns
- **Testing Questions:** See __tests__/ for examples
- **Security Questions:** Review TECHNICAL_DEBT.md security section

---

**Last Updated:** 2025-11-05
**Maintained By:** Development Team + AI Agents
