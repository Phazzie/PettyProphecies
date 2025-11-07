# TarotUpMyHeart - AI Agent Instructions

## Project Overview

Major Arcana tarot deck generator built with SvelteKit and TypeScript. Users upload 1-5 reference images, provide style inputs (theme/tone/description/concept/characters), and the app generates 22 unique tarot card designs using Grok AI (X.AI). Deployed on Vercel.

## Tech Stack

- **Framework**: SvelteKit 2.x
- **Language**: TypeScript (strict mode enabled)
- **Deployment**: Vercel
- **AI Provider**: X.AI (Grok)
  - Text Generation: `grok-4-fast-reasoning`
  - Image Generation: `grok-image-generator`
- **Testing**: Vitest
- **Package Manager**: npm
- **Node Version**: 20.x (see `.nvmrc`)

## ⚠️ CRITICAL: Seam-Driven Development (SDD)

This project follows Seam-Driven Development methodology. **Read `/seam-driven-development.md` FIRST before writing ANY code.**

### SDD Rules for AI Agents

1. **NEVER** write code before contracts are defined in `/contracts`
2. **NEVER** modify contracts once implementation starts (create v2 instead)
3. **ALWAYS** build mock services before real services
4. **ALWAYS** validate contracts pass tests before integration
5. **CHECK** `/SEAMSLIST.md` for all defined seams before adding new ones

### SDD Enforcement

```bash
# Before writing any feature code, verify:
npm run test:contracts  # Must pass
npm run check          # Must pass (no type errors)
git grep "as any"      # Must return nothing
```

## Project Structure

```
/contracts/           # Immutable TypeScript contracts (NEVER modify directly)
  /types/            # Shared types
  [Feature].ts       # One file per seam contract
  index.ts           # Barrel export

/services/
  /mock/             # Mock service implementations
  /real/             # Real service implementations
  factory.ts         # Service factory with USE_MOCKS toggle

/src/
  /lib/              # Reusable components and utilities
    /components/     # Svelte components
    /data/           # Static data
    /utils/          # Utility functions
  /routes/           # SvelteKit file-based routing
    +page.svelte     # Pages
    +page.server.ts  # Server-side logic
    +layout.svelte   # Layouts

/tests/
  /contracts/        # Contract validation tests
  /mocks/            # Mock behavior tests
  /integration/      # Integration tests

/scripts/            # Build and validation scripts
```

## Setup Commands

```bash
# Clone repository
git clone https://github.com/Phazzie/TarotUpMyHeart.git
cd TarotUpMyHeart

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# IMPORTANT: Edit .env and add your XAI_API_KEY

# Start development server (uses mocks by default)
npm run dev

# Open browser
# Navigate to: http://localhost:5173
```

## Development Workflow

### Phase 1: Define Contract (REQUIRED FIRST STEP)

```bash
# 1. Create contract file
touch contracts/YourFeature.ts

# 2. Define TypeScript interfaces
# See existing contracts for examples

# 3. Export from contracts/index.ts
echo "export * from './YourFeature'" >> contracts/index.ts

# 4. Validate contract compiles
npm run check

# 5. Update SEAMSLIST.md
# Add new seam to documentation

# DO NOT PROCEED until contract is reviewed and approved
```

### Phase 2: Build Mock Service

```bash
# 1. Create mock service
touch services/mock/YourFeatureMock.ts

# 2. Implement contract interface
# Mock must return realistic data matching contract exactly

# 3. Add to mock service factory
# Edit services/factory.ts

# 4. Write contract tests
touch tests/contracts/YourFeature.test.ts

# 5. Run tests
npm run test:contracts

# Tests MUST pass before proceeding
```

### Phase 3: Build UI with Mocks

```bash
# Development uses mocks by default (USE_MOCKS=true)
npm run dev

# Build UI components
# Import from $contracts for types
# Import from $services for service instances

# Test with mocks
npm run test
```

### Phase 4: Implement Real Service

```bash
# 1. Create real service
touch services/real/YourFeatureService.ts

# 2. Implement contract interface exactly
# NO deviations from contract allowed

# 3. Add to real service factory
# Edit services/factory.ts

# 4. Run integration readiness check
npm run check:integration-readiness

# 5. Switch to real service
# Set USE_MOCKS=false in .env or service factory

# 6. Test integration
npm run test:integration
```

### Phase 5: Integration

```bash
# Integration should work FIRST TRY if SDD followed correctly
# If it doesn't, see Troubleshooting section below
```

## Testing Commands

```bash
# Type checking (must pass before commits)
npm run check

# Watch mode for type checking
npm run check:watch

# All tests
npm test

# Contract tests only (validates mocks match contracts)
npm run test:contracts

# Mock tests only (validates mock behavior)
npm run test:mocks

# Integration tests only (validates real services)
npm run test:integration

# Run all validation (contracts + mocks + integration)
npm run test:all
```

## Build Commands

```bash
# Development build with mocks
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint

# Format code
npm run format

# Check formatting without changes
npm run format:check
```

## Coding Standards

### TypeScript Strict Mode

```typescript
// ✅ CORRECT: Explicit types
function processUser(user: UserSeam): ProcessedUser {
  return { id: user.id, name: user.name }
}

// ❌ WRONG: Implicit any
function processUser(user) {  // Error: Parameter 'user' implicitly has 'any' type
  return { id: user.id, name: user.name }
}

// ✅ CORRECT: Unknown with validation
function processData(data: unknown): ValidData {
  if (isValidData(data)) {
    return data
  }
  throw new Error('Invalid data')
}

// ❌ WRONG: Using 'any' escape hatch
function processData(data: any): ValidData {  // NEVER USE 'any'
  return data as ValidData
}

// ✅ CORRECT: Type guards
function isUser(value: unknown): value is UserSeam {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  )
}
```

### SvelteKit Conventions

```typescript
// ✅ CORRECT: Use path aliases
import { formatDate } from '$lib/utils/date'
import type { UserSeam } from '$contracts/User'
import { userService } from '$services/factory'

// ❌ WRONG: Relative paths
import { formatDate } from '../../lib/utils/date'
import type { UserSeam } from '../../../contracts/User'

// ✅ CORRECT: Server-side data loading
// +page.server.ts
export async function load() {
  const data = await service.getData()
  return { data }
}

// ✅ CORRECT: Client-side component
// +page.svelte
<script lang="ts">
  export let data
</script>

// ❌ WRONG: Mixing server and client code
// Don't call server-only APIs from components
```

### Contract Immutability Rules

```typescript
// ❌ NEVER DO THIS: Modifying existing contract
interface UserSeam {
  id: string
  name: string
  email: string  // ← Adding field breaks existing code!
}

// ✅ DO THIS: Create new version
interface UserSeamV1 {
  id: string
  name: string
}

interface UserSeamV2 extends UserSeamV1 {
  email: string
}

// ✅ DO THIS: Optional fields for non-breaking changes
interface UserSeam {
  id: string
  name: string
  email?: string  // Optional = safe to add
}
```

### Mock-First Dependency Injection

```typescript
// ✅ CORRECT: Injectable dependency
export class FeatureService {
  constructor(
    private api: IApiClient = getApiClient()  // Factory provides mock or real
  ) {}

  async getData() {
    return this.api.fetch('/data')
  }
}

// Factory determines mock vs real
function getApiClient(): IApiClient {
  return USE_MOCKS ? new MockApiClient() : new RealApiClient()
}

// ❌ WRONG: Hard-coded dependency
export class FeatureService {
  private api = new RealApiClient()  // Can't mock for testing!

  async getData() {
    return this.api.fetch('/data')
  }
}
```

## Common Tasks

### Add a New Seam

```bash
# 1. Define contract
cat > contracts/NewFeature.ts << 'EOF'
/**
 * @purpose: [What this seam does]
 * @requirement: [JIRA-123]
 * @updated: $(date +%Y-%m-%d)
 */

export interface NewFeatureRequest {
  // Input fields
}

export interface NewFeatureResponse {
  // Output fields
}

export interface INewFeatureService {
  execute(req: NewFeatureRequest): Promise<NewFeatureResponse>
}
EOF

# 2. Export from index
echo "export * from './NewFeature'" >> contracts/index.ts

# 3. Update SEAMSLIST.md
# Document the new seam

# 4. Generate mock
# Create services/mock/NewFeatureMock.ts

# 5. Write tests
# Create tests/contracts/NewFeature.test.ts

# 6. Validate
npm run test:contracts
```

### Switch from Mocks to Real Services

```bash
# Pre-flight checks
npm run test:contracts  # Must pass
npm run test:mocks      # Must pass
npm run check           # Must pass
git grep "as any"       # Must return nothing

# Integration readiness
npm run check:integration-readiness

# Switch services
# Edit services/factory.ts:
# Change: const USE_MOCKS = false

# Or use environment variable
echo "USE_MOCKS=false" >> .env

# Test integration
npm run test:integration

# If tests pass, you're done!
# If tests fail, see Troubleshooting below
```

### Validate Contract Compliance

```bash
# Check for type escapes
git grep -n "as any" src/

# Check for manual transformations (code smell)
git grep -n "\.map\|adapt\|transform\|convert" src/ | grep -v node_modules

# Validate all contracts have mocks
npm run check:mock-coverage

# Validate SEAMSLIST.md is up to date
npm run check:seams-documented
```

## Environment Variables

Required variables (see `.env.example`):

```bash
# X.AI Grok API
XAI_API_KEY=your_xai_api_key_here

# Grok model names
GROK_TEXT_MODEL=grok-4-fast-reasoning
GROK_IMAGE_MODEL=grok-image-generator

# Application mode
NODE_ENV=development
USE_MOCKS=true  # Set false to use real Grok API

# Public URL
PUBLIC_APP_URL=http://localhost:5173
```

## Deployment

### Vercel Deployment

```bash
# First time: Connect repository to Vercel
# Go to: https://vercel.com/new
# Import: Phazzie/TarotUpMyHeart

# Configure environment variables in Vercel dashboard:
# - XAI_API_KEY (your Grok API key)
# - GROK_TEXT_MODEL (grok-4-fast-reasoning)
# - GROK_IMAGE_MODEL (grok-image-generator)

# Automatic deployments:
git push origin main  # Auto-deploys to production

git push origin develop  # Auto-deploys to preview
```

### Pre-deployment Checklist

```bash
# 1. All tests pass
npm run test:all

# 2. Build succeeds
npm run build

# 3. No type errors
npm run check

# 4. No lint errors
npm run lint

# 5. Contracts documented
npm run check:seams-documented

# 6. Environment variables set in Vercel

# 7. USE_MOCKS=false in production
```

## Troubleshooting

### Integration Fails After Switching from Mocks

**Run this checklist in order:**

```bash
# Stage 1: Quick Checks (5 minutes)

# Check contract-mock alignment
npm run test:contracts
# If fails: Fix mock to match contract

# Check for type escapes
git grep -n "as any" src/
# If found: Remove 'as any', fix types properly

# Check contract versions
npm run check:integration-readiness
# If fails: Follow output instructions

# Stage 2: Deep Dive (15 minutes)

# Compare mock vs real responses
npm run debug:api-calls
# Logs all API calls and responses

# Validate data shapes
npm run validate:data-shapes
# Compares actual data to contract types

# Trace state transitions
npm run trace:state
# Visualizes state changes

# Stage 3: Emergency (30 minutes)

# Regenerate everything from contracts
npm run codegen -- --force
npm run build
npm run test

# If still broken: Contract design issue
# Review contract against requirements
# Check for ambiguous or incomplete contracts
```

### Common Issues

**Issue: "Property X does not exist on type Y"**

```typescript
// Problem: Mock doesn't match contract
interface UserSeam {
  id: string
  name: string
  email: string  // Added to contract but not mock
}

// Solution: Update mock
const mockUser: UserSeam = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com'  // Add missing field
}
```

**Issue: "Type 'undefined' is not assignable to..."**

```typescript
// Problem: Assuming data always exists
const user = await userService.getUser(id)
console.log(user.name)  // Error if user is undefined

// Solution: Handle undefined case
const user = await userService.getUser(id)
if (!user) {
  throw new Error('User not found')
}
console.log(user.name)  // Safe
```

**Issue: Integration works with mocks, breaks with real API**

```bash
# Root cause: Mock data doesn't match real API shape

# Debug steps:
1. Log real API response: console.log(JSON.stringify(response, null, 2))
2. Compare to contract: Does shape match exactly?
3. If no: Fix the contract OR add adapter layer (only for external APIs)
4. If yes: Check for async timing issues or error cases
```

### When to Ask for Help

Escalate to human developer if:

1. All automated checks pass but integration still fails
2. Contract design is ambiguous (unclear requirements)
3. External API (Grok) behaves differently than documented
4. Need to modify a frozen contract (requires team decision)

## Important Files Reference

- **`/seam-driven-development.md`** - Complete SDD methodology guide
- **`/SEAMSLIST.md`** - Catalog of all defined seams
- **`/CHANGELOG.md`** - Version history
- **`/lessonslearned.md`** - Project-specific insights and patterns
- **`/README.md`** - Human-readable project overview
- **`/.env.example`** - Environment variable template

## What NOT to Do

### ❌ Anti-Patterns (DO NOT DO THESE)

```typescript
// ❌ Writing code before contracts exist
// Always define contract first!

// ❌ Modifying contracts during implementation
// Create v2 instead

// ❌ Using 'any' type
const data: any = response  // FORBIDDEN

// ❌ Manual data transformations
function adapt(raw: any) {
  return { id: raw.user_id }  // Creates drift
}

// ❌ Mixing mocks and real services
const userService = new MockUserService()
const authService = new RealAuthService()  // Don't mix!

// ❌ Skipping contract tests
// "I'll test it later" = integration breaks

// ❌ Type assertions to bypass errors
const user = data as UserSeam  // Hiding real problem

// ❌ Optional fields everywhere
interface UserSeam {
  id?: string    // Makes everything optional
  name?: string  // Defeats type safety
  email?: string
}
```

### ✅ Correct Patterns (DO THESE)

```typescript
// ✅ Contract-first development
// 1. Define contract
// 2. Build mock
// 3. Build UI
// 4. Build real service

// ✅ Type safety with unknown
function process(data: unknown) {
  if (isValidData(data)) {
    return data  // Now typed
  }
  throw new Error('Invalid')
}

// ✅ All mocks or all real
const services = USE_MOCKS
  ? MockServiceFactory.createAll()
  : RealServiceFactory.createAll()

// ✅ Contract versioning
interface UserSeamV1 { ... }
interface UserSeamV2 extends UserSeamV1 { ... }

// ✅ Required fields only
interface UserSeam {
  id: string       // Required
  name: string     // Required
  email?: string   // Truly optional
}
```

## Emergency Contact

If SDD methodology itself appears broken:

1. Review `/seam-driven-development.md` Emergency Protocols
2. Check `/lessonslearned.md` for project-specific solutions
3. Validate against SDD core principles
4. Document issue in `/lessonslearned.md`
5. Escalate to human developer

---

**Remember**: The goal of SDD is to make integration deterministic. If integration fails, it's because a contract was violated or poorly defined, not because integration is inherently risky. Follow the methodology strictly and integration will work the first time.
