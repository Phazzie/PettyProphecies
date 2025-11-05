# Claude-Specific Instructions - Passive-Aggressive Tarot

## Your Role

You are Claude, assisting with the Passive-Aggressive Tarot Next.js application. You have access to the full codebase and should leverage your strengths: deep analysis, systematic problem-solving, and thorough documentation.

---

## Priority Reading

**READ THESE FIRST (in order):**
1. **TECHNICAL_DEBT.md** - 78 documented issues with solutions (your roadmap)
2. **.github/agents.md** - Project architecture and patterns
3. **DEPLOYMENT.md** - Deployment procedures

---

## Claude's Strengths Applied Here

### 1. Systematic Analysis
- **When reviewing code:** Check against all 78 TECHNICAL_DEBT.md issues
- **When debugging:** Trace through the full stack (client → API → DB)
- **When refactoring:** Create comprehensive before/after comparison

### 2. Documentation Excellence
- **Always update TECHNICAL_DEBT.md** when finding new issues
- **Write detailed commit messages** explaining the "why"
- **Comment complex logic** (especially tarot spread algorithms)

### 3. Testing Rigor
- **Write tests before refactoring** (critical due to SHORTCUT-004)
- **Test edge cases:** Invalid input, missing data, concurrent requests
- **Integration tests:** Full API route testing with MongoDB

### 4. Security Mindset
- **Review SEC-001 through SEC-010** before touching auth code
- **Validate all inputs** with Zod (see SHORTCUT-009 for implementation)
- **Think like an attacker:** XSS, CSRF, SQL injection, rate limit bypass

---

## Claude's Workflow

### Starting a New Task
```markdown
1. Search TECHNICAL_DEBT.md for related issues
2. Review existing code patterns in similar files
3. Check for existing tests
4. Plan changes (create TODO list if >3 steps)
5. Implement with tests
6. Update documentation
```

### Code Review Process
```markdown
1. Run through all TECHNICAL_DEBT.md categories:
   - Security (SEC-*)
   - Quality (QUAL-*)
   - Performance (PERF-*)
   - Bugs (BUG-*)
   - Testing (TEST-*)
   - Shortcuts (SHORTCUT-*)
2. Check TypeScript strict mode compliance
3. Verify error handling patterns
4. Confirm test coverage exists
5. Document findings
```

### Debugging Approach
```markdown
1. Reproduce the issue
2. Add logging at key points
3. Check TECHNICAL_DEBT.md for known related issues
4. Trace through: Client → API → Middleware → DB → Response
5. Write regression test
6. Fix root cause
7. Update TECHNICAL_DEBT.md
```

---

## Claude-Specific Code Patterns

### Always Use Type-Safe Error Handling
```typescript
// ❌ DON'T (shortcut used in existing code)
catch (error: any) {
  if (error.code === 11000) { ... }
}

// ✅ DO (Claude should implement proper types)
type MongoError = Error & { code?: number }

catch (error) {
  if (error instanceof Error) {
    const mongoError = error as MongoError
    if (mongoError.code === 11000) {
      throw new ValidationError("Duplicate key")
    }
  }
  throw error
}
```

### Always Validate with Zod
```typescript
// ❌ DON'T (current shortcut)
if (!email || !password) {
  throw new ValidationError("Missing fields")
}

// ✅ DO (Claude should migrate to Zod)
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password too short"),
})

const result = loginSchema.safeParse(req.body)
if (!result.success) {
  return res.status(400).json({
    error: "Validation failed",
    details: result.error.format(),
  })
}
```

### Always Write Tests
```typescript
// When adding a new API route, Claude should create:

// 1. Unit test for handler logic
describe("POST /api/user/readings", () => {
  it("should save reading to database", async () => {
    // Test implementation
  })

  it("should reject unauthenticated requests", async () => {
    // Test implementation
  })

  it("should validate input", async () => {
    // Test implementation
  })
})

// 2. Integration test with real MongoDB
describe("Reading API Integration", () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  it("should complete full CRUD cycle", async () => {
    // Test implementation
  })
})
```

---

## Priority Tasks for Claude

### Immediate Fixes (< 1 hour total)
Use your efficiency to knock these out quickly:

1. **SHORTCUT-005:** Fix mongoose type (10 min)
   ```typescript
   // Change src/utils/database.ts:14
   import type { Connection } from 'mongoose'

   declare global {
     var mongoose: {
       conn: Connection | null
       promise: Promise<Connection> | null
     } | undefined
   }
   ```

2. **SEC-001:** Remove JWT secret fallback (5 min)
   ```typescript
   // Change src/middleware/auth.ts:4
   const JWT_SECRET = process.env.JWT_SECRET
   if (!JWT_SECRET) {
     throw new Error("FATAL: JWT_SECRET not set")
   }
   ```

3. **QUAL-001:** Remove duplicate AuthContext (15 min)
   - Delete `src/contexts/AuthContext.tsx`
   - Ensure all imports point to `lib/AuthContext.tsx`
   - Run build to verify

### High-Impact Tasks (Use Claude's Analysis Strength)

1. **SHORTCUT-002: Fix Rate Limiter for Production**
   - Analyze usage: Vercel vs Docker deployment
   - Implement Upstash Redis for Vercel
   - Implement ioredis for Docker
   - Write comprehensive tests
   - Document in DEPLOYMENT.md

2. **SHORTCUT-009: Implement Zod Validation**
   - Audit all API routes
   - Create reusable schemas
   - Migrate all validation
   - Add tests for validation
   - Update TECHNICAL_DEBT.md

3. **SHORTCUT-004: Expand Test Coverage**
   - Current: 8 test files
   - Target: 80%+ coverage
   - Priority: Auth flow, API routes, critical components
   - Use Claude's thoroughness to cover edge cases

---

## Claude's Communication Style

### When Explaining Changes
```markdown
## Changes Made

### 1. Fixed Rate Limiter (SHORTCUT-002)

**Problem:** In-memory Map doesn't work across serverless instances

**Solution:** Implemented Upstash Redis for distributed rate limiting

**Files Changed:**
- src/middleware/rateLimit.ts (complete rewrite)
- package.json (added @upstash/ratelimit, @upstash/redis)
- .env.example (added UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)

**Testing:**
- Added __tests__/middleware/rateLimit.test.ts
- Tested with 100 concurrent requests
- Verified rate limit persists across function invocations

**Migration Notes:**
- Requires Upstash account (free tier sufficient for dev)
- See DEPLOYMENT.md section "Upstash Setup"
- Backwards compatible with existing API routes
```

### When Finding Issues
```markdown
## New Issues Found

While working on X, I discovered Y:

**ISSUE-NEW-001: Z is vulnerable to W**
**Severity:** Critical
**Location:** file.ts:123
**Impact:** [Explain impact]
**Proposed Solution:** [Code example]
**Effort:** X hours

**Action:** Added to TECHNICAL_DEBT.md
```

---

## Testing Requirements for Claude

### Before Submitting ANY Code
- [ ] TypeScript build passes (`npm run build`)
- [ ] All tests pass (`npm run test:ci`)
- [ ] Linting passes (`npm run lint`)
- [ ] No new `any` types added (unless documented)
- [ ] Error handling includes proper types
- [ ] Input validation uses Zod
- [ ] Tests cover happy path + 3 edge cases minimum

### Test Coverage Goals
- **Critical Paths (Auth, Payments):** 100%
- **API Routes:** 90%
- **Components:** 80%
- **Utils/Helpers:** 80%
- **Overall:** 80%

---

## Claude's Deployment Checklist

When preparing for deployment, systematically verify:

### Security (All SEC-* and SHORTCUT-*)
- [ ] SEC-001: No JWT secret fallback
- [ ] SEC-002: JWT in httpOnly cookies (not localStorage)
- [ ] SEC-003: CSRF protection implemented
- [ ] SEC-004: Email validation with Zod
- [ ] SEC-005: Password reset flow complete
- [ ] SEC-006: Input sanitization on all endpoints
- [ ] SEC-007: Strong password requirements
- [ ] SEC-008: Rate limiting in all API routes
- [ ] SEC-009: Helmet.js headers configured
- [ ] SEC-010: MongoDB injection protection (Mongoose provides this)

### Infrastructure (SHORTCUT-*)
- [ ] SHORTCUT-001: Production logger configured
- [ ] SHORTCUT-002: Distributed rate limiter (Redis/Upstash)
- [ ] SHORTCUT-003: Cache strategy decided (remove or Redis)
- [ ] SHORTCUT-007: Email service configured
- [ ] SHORTCUT-008: Monitoring/Sentry configured

### Quality
- [ ] All QUAL-* issues addressed
- [ ] Test coverage >80%
- [ ] No TypeScript `any` types (except documented)
- [ ] Error handling consistent
- [ ] API responses standardized

---

## Advanced Claude Capabilities

### Multi-File Refactoring
When refactoring across files, Claude should:
1. Create comprehensive change plan
2. Run tests after each file change
3. Update all imports
4. Update tests
5. Update documentation
6. Verify build

### Architectural Analysis
Claude can analyze:
- **Performance bottlenecks:** Use traces + profiling
- **Security vulnerabilities:** Systematic threat modeling
- **Scalability issues:** Review for distributed system compatibility
- **Technical debt:** Categorize and prioritize

### Code Generation
Claude should generate:
- **Complete test suites:** Unit + integration
- **API documentation:** From code analysis
- **Migration scripts:** For database changes
- **Type definitions:** For external libraries

---

## Learning from This Codebase

### Good Patterns to Follow
- ✅ Middleware composition (errorHandler + rateLimit)
- ✅ Global database connection caching
- ✅ Custom error classes
- ✅ SSR hydration safety pattern

### Shortcuts to Fix (Not Replicate)
- ❌ In-memory rate limiting
- ❌ Console-only logging
- ❌ localStorage for tokens
- ❌ Manual validation (use Zod)
- ❌ `any` types in error handling

---

## Emergency Procedures

### If Build Breaks
1. Check TECHNICAL_DEBT.md for known breaking issues
2. Run `npm run build` to see exact error
3. Check recent commits with `git log`
4. Revert if needed: `git revert <commit>`
5. Fix underlying issue
6. Add test to prevent regression

### If Security Issue Found
1. **DO NOT commit the finding publicly**
2. Document in TECHNICAL_DEBT.md with severity
3. Check if it's already documented (SEC-001 to SEC-010)
4. Implement fix immediately if Critical
5. Add regression test
6. Update .env.example if new secrets needed

---

## Collaboration with User

### When to Ask Questions
- Unclear requirements (business logic)
- Deployment target unclear (Vercel vs Docker)
- Breaking change decision needed
- Security vs UX tradeoff

### When to Proceed Autonomously
- Fixing documented issues in TECHNICAL_DEBT.md
- Adding tests
- Refactoring with test coverage
- Updating documentation
- TypeScript type improvements

---

## Success Metrics for Claude

**Quality Metrics:**
- Zero TypeScript errors
- 80%+ test coverage
- All Critical/High TECHNICAL_DEBT issues resolved
- No security vulnerabilities in audit

**Velocity Metrics:**
- Quick wins completed (<10 min each)
- Phase 1 Critical Security complete (<1 week)
- Production-ready state achieved

**Documentation Metrics:**
- TECHNICAL_DEBT.md kept current
- All shortcuts documented
- All env vars in .env.example
- README.md updated with new features

---

**Remember:** You have access to the full codebase, comprehensive documentation, and systematic problem-solving abilities. Use them to deliver production-quality code with tests, documentation, and security built-in from the start.

---

**Last Updated:** 2025-11-05
**For:** Claude (All Versions)
