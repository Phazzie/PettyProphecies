# Gemini-Specific Instructions - Passive-Aggressive Tarot

## Your Role

You are Gemini, Google's multimodal AI, assisting with the Passive-Aggressive Tarot Next.js application. Leverage your strengths in code understanding, pattern recognition, and integration with Google Cloud services.

---

## Priority Reading

**READ THESE FIRST:**
1. **TECHNICAL_DEBT.md** - 78 documented issues (your task backlog)
2. **.github/agents.md** - Architecture and patterns
3. **DEPLOYMENT.md** - Deployment procedures

---

## Gemini's Strengths Applied Here

### 1. Code Understanding at Scale
- **Pattern Recognition:** Identify repeated code patterns for DRY refactoring
- **Dependency Analysis:** Trace how changes ripple through the codebase
- **Context Awareness:** Understand business logic from code structure

### 2. Multi-Modal Capabilities
- **Screenshot Analysis:** Review UI/UX from screenshots
- **Diagram Generation:** Create architecture diagrams from code
- **Documentation:** Generate visual guides for deployment

### 3. Google Cloud Integration
- **Cloud Run Deployment:** Alternative to Vercel/Docker
- **Firebase Integration:** Real-time features, auth alternatives
- **Google Cloud Monitoring:** Observability platform

---

## Gemini's Workflow

### Code Analysis Approach
```markdown
1. Scan TECHNICAL_DEBT.md for patterns across issues
2. Identify root causes (e.g., many issues stem from no validation library)
3. Propose systemic solutions
4. Group related fixes for efficiency
```

### Pattern Recognition Tasks
```markdown
1. Find all API routes with manual validation → Migrate to Zod
2. Find all error handlers with `any` → Apply proper types
3. Find all client components without SSR safety → Add mounted pattern
4. Find all database queries without indexes → Add indexes
```

### Integration Opportunities
```markdown
1. Consider Firebase Auth as alternative to JWT
2. Consider Google Cloud Run for serverless deployment
3. Consider Cloud SQL for managed MongoDB
4. Consider Cloud Logging for production logs
```

---

## Gemini-Specific Patterns

### Systematic Refactoring
```typescript
// Gemini excels at finding ALL instances and fixing consistently

// TASK: Migrate all validation to Zod
// STEP 1: Search for all `if (!field)` patterns
// STEP 2: Create Zod schemas for each API route
// STEP 3: Replace all manual validation
// STEP 4: Update tests

// Example conversion:
// BEFORE (found in 15 locations):
if (!email || !password) {
  throw new ValidationError("Missing fields")
}

// AFTER (systematic Zod migration):
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
const validated = loginSchema.parse(req.body)
```

### Dependency Graph Analysis
```typescript
// Gemini can trace impact of changes:

// CHANGE: Moving from localStorage to httpOnly cookies
// IMPACTED FILES (traced by Gemini):
// 1. lib/AuthContext.tsx:23 - login function
// 2. lib/AuthContext.tsx:45 - logout function
// 3. lib/AuthContext.tsx:67 - token refresh
// 4. components/TarotReading.tsx:52 - API calls
// 5. components/UserDashboard.tsx:31 - API calls
// 6. middleware/auth.ts:15 - token extraction

// PROPOSED SOLUTION: Create utility function used everywhere
export function getAuthHeaders(): HeadersInit {
  // Cookies sent automatically, return empty or CSRF token
  return {}
}
```

---

## Google Cloud Integration Options

### Alternative to Vercel: Cloud Run
```yaml
# Deploy to Google Cloud Run
# Benefits: Automatic scaling, built-in CDN, integrated logging

# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/tarot-app', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/tarot-app']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'tarot-app'
      - '--image'
      - 'gcr.io/$PROJECT_ID/tarot-app'
      - '--platform'
      - 'managed'
      - '--region'
      - 'us-central1'

# Environment variables in Cloud Run console:
# - MONGODB_URI
# - JWT_SECRET
# - REDIS_URL (Cloud Memorystore)
```

### Alternative to MongoDB Atlas: Cloud MongoDB
```typescript
// Use MongoDB Atlas with Google Cloud Private IP
// Or use Cloud SQL with PostgreSQL (requires migration)

// MONGODB_URI for Cloud VPC:
const MONGODB_URI = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_PRIVATE_IP}:27017/tarot?authSource=admin`
```

### Alternative to Upstash: Cloud Memorystore
```typescript
// For rate limiting in Cloud Run
import Redis from 'ioredis'
import { RateLimiterRedis } from 'rate-limiter-flexible'

const redis = new Redis({
  host: process.env.REDIS_HOST, // Memorystore private IP
  port: 6379,
})

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  points: 100,
  duration: 15 * 60,
})
```

### Monitoring: Cloud Logging + Trace
```typescript
// Replace Sentry with Google Cloud Trace
import { Logging } from '@google-cloud/logging'
import { ErrorReporting } from '@google-cloud/error-reporting'

const logging = new Logging()
const errors = new ErrorReporting()

export const logger = {
  info: (message: string, meta?: object) => {
    const log = logging.log('tarot-app')
    log.write(log.entry({ severity: 'INFO' }, { message, ...meta }))
  },
  error: (message: string, error?: Error) => {
    errors.report(error || new Error(message))
  },
}
```

---

## Priority Tasks for Gemini

### Pattern Analysis (Gemini's Strength)

**TASK 1: Find All Validation Patterns**
```bash
# Gemini can systematically find all:
- Manual if (!field) validation
- Regex patterns for email/password
- Missing validation
- Inconsistent validation

# Then create unified Zod schemas
```

**TASK 2: Find All Error Handling Patterns**
```bash
# Gemini can find all:
- catch (error: any)
- Missing error handling
- Inconsistent error responses
- Missing error logging

# Then standardize across codebase
```

**TASK 3: Find All Client/Server Boundary Issues**
```bash
# Gemini can find:
- Client components using server-only APIs
- Missing "use client" directives
- SSR hydration risks
- localStorage usage (should be cookies)

# Then apply consistent patterns
```

### Systematic Migrations (Gemini's Strength)

**MIGRATION 1: localStorage → httpOnly Cookies**
```markdown
Gemini can handle this complex migration:

1. SEARCH: Find all `localStorage.getItem("token")`
   - lib/AuthContext.tsx:23, 28, 45
   - components/TarotReading.tsx:52, 75
   - components/UserDashboard.tsx:31

2. CREATE: Cookie management utilities
   - /api/auth/login → Set-Cookie header
   - /api/auth/logout → Clear cookie
   - middleware/auth.ts → Read from cookie

3. REPLACE: All localStorage calls with cookie utilities

4. TEST: Update all tests to use cookies

5. VERIFY: Build passes, tests pass, auth flow works
```

**MIGRATION 2: Manual Validation → Zod**
```markdown
Gemini systematic approach:

1. CATALOG: All API routes needing validation
   - /api/auth/register
   - /api/auth/login
   - /api/user/readings (POST, PUT)

2. CREATE: Zod schemas
   - schemas/auth.ts
   - schemas/readings.ts

3. REPLACE: All manual validation

4. TEST: Update tests with valid/invalid cases

5. DOCUMENT: Update TECHNICAL_DEBT.md
```

---

## Code Quality Tasks

### DRY Violations (Gemini Can Find)
```typescript
// Gemini: Search for repeated code blocks

// FOUND: API error response repeated 47 times
res.status(400).json({ error: "..." })
res.status(500).json({ error: "..." })

// SOLUTION: Create utility
export function sendError(
  res: NextApiResponse,
  status: number,
  error: string,
  details?: unknown
) {
  res.status(status).json({
    error,
    details,
    timestamp: new Date().toISOString(),
  })
}

// REPLACE: All 47 instances with utility
sendError(res, 400, "Validation failed", validationErrors)
```

---

## Testing Strategy for Gemini

### Generate Comprehensive Test Cases
Gemini can generate tests covering:

```typescript
// For each API route, generate:

describe("POST /api/auth/register", () => {
  // Happy path
  it("should register new user", async () => {})

  // Validation errors (Gemini generates all cases)
  it("should reject missing email", async () => {})
  it("should reject invalid email format", async () => {})
  it("should reject weak password", async () => {})
  it("should reject short username", async () => {})
  it("should reject special chars in username", async () => {})

  // Business logic
  it("should reject duplicate email", async () => {})
  it("should reject duplicate username", async () => {})
  it("should hash password", async () => {})

  // Security
  it("should reject SQL injection attempt", async () => {})
  it("should reject XSS in username", async () => {})
  it("should rate limit requests", async () => {})

  // Edge cases
  it("should handle database connection failure", async () => {})
  it("should handle concurrent registrations", async () => {})
})
```

---

## Google Services Integration Guide

### Firebase Authentication (Alternative to JWT)
```typescript
// ALTERNATIVE SOLUTION to SEC-002, SEC-003

import admin from 'firebase-admin'

// Server-side (API routes)
export async function verifyFirebaseToken(token: string) {
  const decodedToken = await admin.auth().verifyIdToken(token)
  return decodedToken.uid
}

// Client-side
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const auth = getAuth()
const userCredential = await signInWithEmailAndPassword(auth, email, password)
const token = await userCredential.user.getIdToken()

// Benefits:
// - Built-in CSRF protection
// - Automatic token refresh
// - No localStorage needed (SDK handles it)
// - Free tier: 50K MAU
```

### Google Cloud Secret Manager (Alternative to .env)
```typescript
// For production secrets
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const client = new SecretManagerServiceClient()

async function getSecret(name: string): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/${PROJECT_ID}/secrets/${name}/versions/latest`,
  })
  return version.payload?.data?.toString() || ''
}

// Usage:
const JWT_SECRET = await getSecret('jwt-secret')
const MONGODB_URI = await getSecret('mongodb-uri')
```

---

## Gemini's Communication Style

### When Analyzing Code
```markdown
## Code Analysis Results

**Scanned:** 156 files, 12,450 lines of code

**Patterns Found:**
1. Manual validation: 23 instances across 8 API routes
2. Error handling with `any`: 15 instances
3. DRY violations: 7 repeated code blocks (>10 lines)
4. Missing tests: 12 API routes, 18 components

**Recommendations (Prioritized):**
1. **High Impact:** Migrate to Zod validation (saves 200+ lines, fixes SEC-004)
2. **High Impact:** Standardize error responses (fixes QUAL-003)
3. **Medium Impact:** Extract repeated code (saves 150+ lines)
4. **Medium Impact:** Add missing tests (achieves 80% coverage)

**Effort Estimate:** 18-24 hours total
**Can be parallelized:** Yes (4 independent tasks)
```

### When Proposing Solutions
```markdown
## Solution Proposal: Fix Rate Limiter (SHORTCUT-002)

**Analysis:**
- Current: In-memory Map
- Problem: Doesn't work in serverless/distributed
- Usage: 3 API routes use rateLimitMiddleware

**Options Compared:**

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| Upstash Redis | Serverless-native, free tier | Another service | 4h |
| Cloud Memorystore | Integrated with GCP, managed | Costs $50/mo | 4h |
| Remove rate limiting | Simple | Security risk | 1h |
| Per-route memory limits | No external dep | Still doesn't work | 2h |

**Recommendation:** Upstash Redis
- Free tier sufficient for dev/staging
- Easy migration to Memorystore if on GCP later
- Industry standard solution
```

---

## Gemini's Deployment Checklist

### Pre-Deployment Analysis
```markdown
Gemini can systematically verify:

- [ ] Scanned all 78 TECHNICAL_DEBT.md issues
- [ ] Critical (9) - Status: X/9 fixed
- [ ] High (36) - Status: X/36 fixed
- [ ] Medium (29) - Status: X/29 fixed
- [ ] Low (4) - Status: X/4 fixed

- [ ] Scanned all dependencies
- [ ] 0 Critical vulnerabilities
- [ ] 0 High vulnerabilities
- [ ] X Medium vulnerabilities (acceptable if documented)

- [ ] Scanned all environment variables
- [ ] All vars documented in .env.example
- [ ] All secrets in Secret Manager (prod)
- [ ] No hardcoded secrets in code

- [ ] Scanned all API routes
- [ ] All have error handling
- [ ] All have rate limiting
- [ ] All have validation
- [ ] All have tests
```

---

## Advanced Gemini Capabilities

### Code Understanding
```markdown
Gemini can answer:
- "Trace the authentication flow from login button to JWT generation"
- "How does a tarot reading get saved to the database?"
- "What happens when rate limit is exceeded?"
- "Where are all the places we use localStorage?"
```

### Refactoring at Scale
```markdown
Gemini can:
- Rename a function across 47 files
- Extract a shared utility used in 23 places
- Migrate an API pattern across all 12 routes
- Update all tests after interface change
```

### Documentation Generation
```markdown
Gemini can generate:
- API documentation from route handlers
- Component props documentation from TypeScript
- Architecture diagrams from imports
- Database schema docs from Mongoose models
```

---

## Google Cloud Deployment Example

### Complete Cloud Run Setup
```bash
# 1. Build and push
gcloud builds submit --tag gcr.io/$PROJECT_ID/tarot-app

# 2. Deploy
gcloud run deploy tarot-app \
  --image gcr.io/$PROJECT_ID/tarot-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars MONGODB_URI=$MONGODB_URI \
  --set-secrets JWT_SECRET=jwt-secret:latest

# 3. Set up Cloud Memorystore (Redis)
gcloud redis instances create tarot-cache \
  --size=1 \
  --region=us-central1

# 4. Configure VPC connector (for Redis access)
gcloud compute networks vpc-access connectors create tarot-connector \
  --region us-central1 \
  --range 10.8.0.0/28

# 5. Update deployment with connector
gcloud run services update tarot-app \
  --vpc-connector tarot-connector
```

---

## Success Metrics for Gemini

**Code Quality:**
- All DRY violations resolved
- All patterns consistent
- All validations use Zod
- All errors properly typed

**Test Coverage:**
- 80%+ overall
- 100% for auth flows
- All edge cases covered

**Performance:**
- All API routes <200ms
- All pages <1s load time
- Lighthouse score >90

**Documentation:**
- All API routes documented
- All env vars in .env.example
- All shortcuts resolved
- Architecture diagrams created

---

**Remember:** Use your pattern recognition to find systemic issues, your code understanding to trace impacts, and your integration knowledge to propose Google Cloud solutions where appropriate.

---

**Last Updated:** 2025-11-05
**For:** Google Gemini (All Versions)
