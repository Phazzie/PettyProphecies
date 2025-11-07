# AI Development Checklist - TarotUpMyHeart

**Purpose**: This checklist ensures any AI agent working on this project follows Seam-Driven Development (SDD) methodology correctly.

**When to use**: Reference this checklist before starting ANY task.

---

## 📋 Before Starting ANY Task

### 1. Understand the Context

- [ ] Read `AGENTS.md` for project overview and coding standards
- [ ] Read `seam-driven-development.md` to understand SDD methodology
- [ ] Check `SEAMSLIST.md` to see all existing seams
- [ ] Check `CHANGELOG.md` to see recent changes
- [ ] Review related issues/PRs if applicable

### 2. Identify the Task Type

What kind of task is this?

- [ ] **New Feature** → Go to "New Feature Workflow"
- [ ] **Bug Fix** → Go to "Bug Fix Workflow"
- [ ] **Refactoring** → Go to "Refactoring Workflow"
- [ ] **Documentation** → Go to "Documentation Workflow"
- [ ] **Testing** → Go to "Testing Workflow"

---

## 🎯 New Feature Workflow

### Phase 1: Requirements & Planning

#### Step 1: Understand Requirements
- [ ] Read the user story/requirement completely
- [ ] Identify all inputs and outputs
- [ ] List all user interactions
- [ ] Identify edge cases and error scenarios
- [ ] Ask clarifying questions if anything is unclear

#### Step 2: Identify Seams
- [ ] List ALL data boundaries for this feature
- [ ] For each boundary, identify:
  - [ ] Source (where data comes from)
  - [ ] Destination (where data goes)
  - [ ] Input shape (what data crosses)
  - [ ] Output shape (what data is returned)
- [ ] Check if existing seams can be reused
- [ ] Document new seams needed in notes

#### Step 3: Check for Existing Seams
- [ ] Open `/SEAMSLIST.md`
- [ ] Search for similar seams
- [ ] If exists: Reuse existing seam (DO NOT create duplicate)
- [ ] If doesn't exist: Proceed to define new seam

### Phase 2: Define Contracts (CRITICAL)

#### Step 4: Create Contract File
- [ ] Create `/contracts/[FeatureName].ts`
- [ ] Add JSDoc comment with:
  - [ ] `@purpose` - What this seam does
  - [ ] `@requirement` - Link to requirement ID
  - [ ] `@updated` - Current date
- [ ] Import common types from `/contracts/types/common.ts`

#### Step 5: Define Input Contract
```typescript
export interface [Feature]Input {
  // Define ALL input fields
  // Use descriptive names
  // Add JSDoc comments for each field
  // Use TypeScript types (NO 'any')
  // Mark optional fields with '?'
}
```
- [ ] All input fields defined
- [ ] All fields have types
- [ ] All fields have comments
- [ ] No `any` types
- [ ] Optional fields marked with `?`

#### Step 6: Define Output Contract
```typescript
export interface [Feature]Output {
  // Define ALL output fields
  // Match the data shape exactly
  // Consider pagination if list
  // Include metadata if needed
}
```
- [ ] All output fields defined
- [ ] Matches expected data shape
- [ ] Includes error states
- [ ] Includes loading states (if async)

#### Step 7: Define Service Interface
```typescript
export interface I[Feature]Service {
  execute(input: [Feature]Input): Promise<ServiceResponse<[Feature]Output>>
}
```
- [ ] Service interface defined
- [ ] Uses `ServiceResponse` wrapper
- [ ] Method names are clear
- [ ] Return type is correct

#### Step 8: Define Error Cases
```typescript
export enum [Feature]ErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  // ... more error codes
}
```
- [ ] All error scenarios listed
- [ ] Error codes defined
- [ ] Error messages defined
- [ ] Retryable flag considered

#### Step 9: Validate Contract
- [ ] Export contract from `/contracts/index.ts`
- [ ] Run `npm run check` - Must pass with no errors
- [ ] No `any` types in contract
- [ ] All imports resolve correctly

#### Step 10: Document in SEAMSLIST.md
- [ ] Open `/SEAMSLIST.md`
- [ ] Add new seam section using template
- [ ] Fill in all details:
  - [ ] Seam number (increment from last)
  - [ ] Boundary description
  - [ ] Input/output contracts
  - [ ] Dependencies
  - [ ] Status checklist
  - [ ] Error cases
  - [ ] Example usage
- [ ] Update seam count in header
- [ ] Update "Last Updated" date

### Phase 3: Build Mock Service

#### Step 11: Create Mock File
- [ ] Create `/services/mock/[Feature]Mock.ts`
- [ ] Import contract from `/contracts`
- [ ] Implement service interface

#### Step 12: Implement Mock
```typescript
import type { I[Feature]Service, [Feature]Input, [Feature]Output } from '$contracts/[Feature]'

export class [Feature]MockService implements I[Feature]Service {
  async execute(input: [Feature]Input): Promise<ServiceResponse<[Feature]Output>> {
    // Return realistic mock data
    // Simulate delays (100-300ms)
    // Handle error cases
    // Validate input
  }
}
```
- [ ] Mock implements interface exactly
- [ ] Returns realistic data
- [ ] Simulates delay (`await new Promise(resolve => setTimeout(resolve, 200))`)
- [ ] Handles all error cases
- [ ] Validates input (throws on invalid data)
- [ ] Data matches contract shape EXACTLY

#### Step 13: Add to Mock Factory
- [ ] Open `/services/factory.ts` (or create if doesn't exist)
- [ ] Import mock service
- [ ] Add to factory function
- [ ] Ensure USE_MOCKS flag respected

#### Step 14: Test Mock Data Shape
- [ ] Create test file: `/tests/contracts/[Feature].test.ts`
- [ ] Test: Mock returns correct shape
- [ ] Test: All required fields present
- [ ] Test: No extra fields
- [ ] Test: Field types correct
- [ ] Run `npm run test:contracts` - Must pass

### Phase 4: Build UI (If Applicable)

#### Step 15: Create Component
- [ ] Create component in `/src/lib/components/`
- [ ] Import types from `/contracts`
- [ ] Import service from `/services/factory`

#### Step 16: Implement Component
```svelte
<script lang="ts">
  import type { [Feature]Input, [Feature]Output } from '$contracts/[Feature]'
  import { featureService } from '$services/factory'

  // Props with types
  export let initialData: SomeType

  // State with types
  let state: AsyncState<[Feature]Output> = { loading: false }

  async function handleAction(input: [Feature]Input) {
    state = { loading: true }
    try {
      const response = await featureService.execute(input)
      if (response.success) {
        state = { loading: false, data: response.data }
      } else {
        state = { loading: false, error: new Error(response.error?.message) }
      }
    } catch (error) {
      state = { loading: false, error: error as Error }
    }
  }
</script>
```
- [ ] All props typed
- [ ] All state typed
- [ ] Handles loading state
- [ ] Handles success state
- [ ] Handles error state
- [ ] Uses service from factory (respects USE_MOCKS)

#### Step 17: Test with Mocks
- [ ] Run `npm run dev`
- [ ] Navigate to component
- [ ] Test all success paths
- [ ] Test all error paths
- [ ] Test loading states
- [ ] Verify data displays correctly

### Phase 5: Implement Real Service

#### Step 18: Create Real Service File
- [ ] Create `/services/real/[Feature]Service.ts`
- [ ] Import contract from `/contracts`
- [ ] Import API client or SDK

#### Step 19: Implement Real Service
```typescript
import type { I[Feature]Service, [Feature]Input, [Feature]Output } from '$contracts/[Feature]'

export class [Feature]Service implements I[Feature]Service {
  constructor(private apiKey: string) {}

  async execute(input: [Feature]Input): Promise<ServiceResponse<[Feature]Output>> {
    try {
      // Make real API call
      // Transform response to match contract EXACTLY
      // NO manual transformations (must match contract)
      return { success: true, data: response }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ERROR_CODE',
          message: 'User-friendly message',
          retryable: true
        }
      }
    }
  }
}
```
- [ ] Implements interface exactly (same as mock)
- [ ] Makes real API calls
- [ ] Handles authentication
- [ ] Handles rate limiting
- [ ] Returns data matching contract EXACTLY
- [ ] NO manual transformations
- [ ] Handles all error cases
- [ ] Provides user-friendly error messages

#### Step 20: Add to Real Service Factory
- [ ] Open `/services/factory.ts`
- [ ] Import real service
- [ ] Add to factory function
- [ ] Ensure USE_MOCKS=false uses real service

#### Step 21: Write Integration Tests
- [ ] Create `/tests/integration/[Feature].test.ts`
- [ ] Test real API calls (may need API key)
- [ ] Test success scenarios
- [ ] Test error scenarios
- [ ] Test rate limiting
- [ ] Run `npm run test:integration` - Must pass

### Phase 6: Integration

#### Step 22: Pre-Integration Checklist
- [ ] Run `npm run check` - Must pass
- [ ] Run `npm run test:contracts` - Must pass
- [ ] Run `npm run test:mocks` - Must pass
- [ ] Run `npm run test:integration` - Must pass
- [ ] Search for `any` types: `git grep "as any"` - Must return nothing
- [ ] No manual transformations exist
- [ ] SEAMSLIST.md updated
- [ ] CHANGELOG.md updated

#### Step 23: Switch to Real Service
- [ ] Set `USE_MOCKS=false` in `.env` or factory
- [ ] Test feature end-to-end
- [ ] Verify all paths work
- [ ] Verify error handling works

#### Step 24: If Integration Fails
🚨 **STOP**: Integration should work first try if SDD followed correctly.

Run Emergency Protocols:
1. [ ] Check contract version mismatch
2. [ ] Validate mock data matches contract
3. [ ] Check for manual transformations
4. [ ] Search for `any` type escapes
5. [ ] Verify both services implement same interface
6. [ ] Review contract design (may be wrong)

### Phase 7: Finalize

#### Step 25: Update Documentation
- [ ] Update `CHANGELOG.md` with new feature
- [ ] Update `README.md` if user-facing
- [ ] Update `lessonslearned.md` if new patterns discovered
- [ ] Add code comments for complex logic

#### Step 26: Create Pull Request
- [ ] Commit changes with descriptive message
- [ ] Push to feature branch
- [ ] Create PR using template
- [ ] Fill out ALL checklist items in PR template
- [ ] Ensure CI passes

---

## 🐛 Bug Fix Workflow

### Phase 1: Understand the Bug

#### Step 1: Reproduce the Bug
- [ ] Read bug report completely
- [ ] Identify steps to reproduce
- [ ] Try to reproduce locally
- [ ] Confirm bug exists

#### Step 2: Identify the Seam
- [ ] Which seam is affected?
- [ ] Check `/SEAMSLIST.md` for seam details
- [ ] Review contract: `/contracts/[Seam].ts`

#### Step 3: Identify Root Cause
Check in this order:
- [ ] Is the contract wrong? (doesn't match requirements)
- [ ] Is the mock wrong? (doesn't match contract)
- [ ] Is the real service wrong? (doesn't match contract)
- [ ] Is the UI wrong? (doesn't use contract correctly)
- [ ] Is it an integration issue? (contract mismatch)

### Phase 2: Fix the Bug

#### If Contract is Wrong:
⚠️ **CRITICAL**: Contracts are immutable!
- [ ] Can this be a non-breaking change (optional field)?
  - If yes: Add optional field to existing contract
  - If no: Create new contract version (V2)
- [ ] Update ALL consumers of the contract
- [ ] Update mocks to match new contract
- [ ] Update real services to match new contract
- [ ] Update tests

#### If Mock is Wrong:
- [ ] Fix mock to match contract exactly
- [ ] Update tests if needed
- [ ] Run `npm run test:contracts` - Must pass

#### If Real Service is Wrong:
- [ ] Fix service to match contract exactly
- [ ] Update tests if needed
- [ ] Run `npm run test:integration` - Must pass

#### If UI is Wrong:
- [ ] Fix UI to use contract correctly
- [ ] Handle all states (loading, success, error)
- [ ] Update tests if needed

### Phase 3: Verify Fix

#### Step 4: Test the Fix
- [ ] Reproduce original bug - Should be fixed
- [ ] Test all related functionality
- [ ] Test error cases
- [ ] Run all tests: `npm run test:all` - Must pass
- [ ] Run type checking: `npm run check` - Must pass

#### Step 5: Update Documentation
- [ ] Update `CHANGELOG.md`
- [ ] Update `lessonslearned.md` if new pattern
- [ ] Add code comments explaining fix

#### Step 6: Create Pull Request
- [ ] Use bug fix PR template
- [ ] Reference issue number
- [ ] Describe root cause and fix
- [ ] Ensure CI passes

---

## 🔄 Refactoring Workflow

### Phase 1: Plan Refactoring

#### Step 1: Identify What to Refactor
- [ ] Clearly define what needs refactoring
- [ ] Identify affected seams
- [ ] List files to be changed

#### Step 2: Ensure No Contract Changes
⚠️ **CRITICAL**: Refactoring must NOT change contracts!
- [ ] Verify contracts will remain unchanged
- [ ] If contracts must change, this is NOT refactoring (it's a new feature)

### Phase 2: Refactor

#### Step 3: Make Changes
- [ ] Refactor implementation
- [ ] Preserve all external interfaces
- [ ] Preserve all contract implementations
- [ ] Improve code quality without changing behavior

#### Step 4: Verify Nothing Broke
- [ ] Run `npm run test:all` - Must pass
- [ ] Run `npm run check` - Must pass
- [ ] Run `npm run lint` - Must pass
- [ ] Manual testing - Everything works same as before

### Phase 3: Finalize

#### Step 5: Update Documentation
- [ ] Update code comments if needed
- [ ] Update `lessonslearned.md` if new pattern
- [ ] Update `CHANGELOG.md` as "Changed" or "Code quality"

#### Step 6: Create Pull Request
- [ ] Use refactoring PR template
- [ ] Emphasize no behavioral changes
- [ ] Show before/after code
- [ ] Ensure CI passes

---

## 📚 Documentation Workflow

### Step 1: Identify What Needs Documentation
- [ ] New feature?
- [ ] API documentation?
- [ ] Architecture documentation?
- [ ] User guide?

### Step 2: Write Documentation
- [ ] Use clear, concise language
- [ ] Include code examples
- [ ] Include diagrams if helpful
- [ ] Follow existing documentation style

### Step 3: Update Related Files
- [ ] Update `README.md` if user-facing
- [ ] Update `AGENTS.md` if affects AI development
- [ ] Update `SEAMSLIST.md` if seam-related
- [ ] Update `CHANGELOG.md` as "Documentation"

### Step 4: Review and Submit
- [ ] Check for typos
- [ ] Verify all links work
- [ ] Ensure formatting is correct
- [ ] Create PR with documentation changes

---

## 🧪 Testing Workflow

### Step 1: Identify Test Type Needed
- [ ] Contract test (mock matches contract)
- [ ] Mock test (mock behavior correct)
- [ ] Integration test (real service works)
- [ ] UI test (component works)

### Step 2: Write Tests

#### Contract Tests (`/tests/contracts/`)
```typescript
import { describe, it, expect } from 'vitest'
import type { Feature Output } from '$contracts/Feature'
import { mockFeatureService } from '$services/mock/FeatureMock'

describe('Feature Contract', () => {
  it('mock returns valid FeatureOutput', async () => {
    const result = await mockFeatureService.execute(input)

    expect(result).toHaveProperty('success')
    if (result.success) {
      expect(result.data).toHaveProperty('field1')
      expect(typeof result.data.field1).toBe('string')
    }
  })
})
```
- [ ] Test mock matches contract shape
- [ ] Test all required fields present
- [ ] Test field types correct
- [ ] Test no extra fields

#### Mock Tests (`/tests/mocks/`)
```typescript
describe('Feature Mock Service', () => {
  it('handles success case', async () => { /* ... */ })
  it('handles error case', async () => { /* ... */ })
  it('validates input', async () => { /* ... */ })
})
```
- [ ] Test all success paths
- [ ] Test all error paths
- [ ] Test input validation
- [ ] Test edge cases

#### Integration Tests (`/tests/integration/`)
```typescript
describe('Feature Real Service', () => {
  it('calls real API successfully', async () => { /* ... */ })
  it('handles API errors', async () => { /* ... */ })
})
```
- [ ] Test real API calls (may need API key)
- [ ] Test success scenarios
- [ ] Test error handling
- [ ] Test rate limiting

### Step 3: Run Tests
- [ ] Run specific test: `npm test -- [filename]`
- [ ] Run test type: `npm run test:contracts` or `test:mocks` or `test:integration`
- [ ] Run all tests: `npm run test:all`
- [ ] All tests must pass

### Step 4: Update Documentation
- [ ] Update `CHANGELOG.md` if significant test coverage added

---

## ⚠️ Common Mistakes to Avoid

### 1. Modifying Contracts During Implementation
❌ **NEVER DO THIS**
```typescript
// Week 1: Original contract
interface UserSeam {
  id: string
  name: string
}

// Week 2: Modified (WRONG!)
interface UserSeam {
  id: string
  name: string
  email: string  // Added later - BREAKS EVERYTHING
}
```

✅ **DO THIS INSTEAD**
```typescript
// Week 1: Original contract
interface UserSeamV1 {
  id: string
  name: string
}

// Week 2: New version
interface UserSeamV2 extends UserSeamV1 {
  email: string
}
```

### 2. Using `any` Type
❌ **NEVER DO THIS**
```typescript
const data: any = response
const user: any = await service.getUser()
```

✅ **DO THIS INSTEAD**
```typescript
const data: unknown = response
if (isValidData(data)) {
  // data is now typed
}

const response = await service.getUser()
if (response.success) {
  const user: User = response.data
}
```

### 3. Manual Data Transformations
❌ **AVOID THIS**
```typescript
function adaptBackendData(raw: any): User {
  return {
    id: raw.user_id,  // Field name mismatch
    name: raw.full_name,  // Field name mismatch
  }
}
```

✅ **DO THIS INSTEAD**
- Fix the backend to match the contract
- OR isolate transformation in dedicated API gateway with its own tests

### 4. Mixing Mocks and Real Services
❌ **DON'T DO THIS**
```typescript
const userService = USE_MOCKS ? new MockUserService() : new RealUserService()
const authService = new RealAuthService()  // Mixed!
```

✅ **DO THIS INSTEAD**
```typescript
const services = USE_MOCKS
  ? MockServiceFactory.createAll()
  : RealServiceFactory.createAll()
```

### 5. Skipping Contract Tests
❌ **DON'T SKIP**
"I'll test it later" → Integration breaks

✅ **ALWAYS TEST**
Write contract tests immediately after creating mock

### 6. Not Documenting Seams
❌ **DON'T FORGET**
Create seam but don't update SEAMSLIST.md

✅ **ALWAYS DOCUMENT**
Update SEAMSLIST.md immediately after creating contract

---

## 🚨 Emergency Protocols

### If Integration Fails Despite Following SDD

**Run this checklist in order:**

#### Stage 1: Quick Checks (5 min)
```bash
# 1. Check for type escapes
git grep -n "as any" src/ contracts/ services/

# 2. Run contract tests
npm run test:contracts

# 3. Check type errors
npm run check
```

#### Stage 2: Deep Dive (15 min)
```bash
# 1. Check contract versions match
# Compare versions in different parts of codebase

# 2. Validate mock data
# Manually inspect mock return values

# 3. Check for manual transformations
git grep -n -E "adapt|transform|convert" src/ services/
```

#### Stage 3: Nuclear Option (30 min)
```bash
# 1. Regenerate from contracts
npm run check  # Fix all type errors
npm run build  # Rebuild
npm run test:all  # Rerun all tests

# 2. If still broken: Contract design is wrong
# Review contract against requirements
# Check for ambiguous or incomplete contracts
```

#### Stage 4: Human Escalation
If all automated checks pass but integration still fails:
- [ ] Document the issue in `/lessonslearned.md`
- [ ] Create detailed bug report
- [ ] Tag for human review
- [ ] Include: What you tried, what failed, error messages

---

## ✅ Final Checklist Before Committing

Run this checklist before EVERY commit:

### Code Quality
- [ ] Run `npm run check` → Must pass
- [ ] Run `npm run lint` → Must pass
- [ ] Run `npm run test:all` → Must pass
- [ ] Search for `any`: `git grep "as any"` → Must be empty
- [ ] No `console.log` statements (use proper logging)
- [ ] No commented-out code

### Documentation
- [ ] `SEAMSLIST.md` updated (if new seam)
- [ ] `CHANGELOG.md` updated (if user-facing change)
- [ ] `lessonslearned.md` updated (if new pattern)
- [ ] Code comments added for complex logic

### SDD Compliance
- [ ] No contracts modified (or new version created)
- [ ] All mocks match contracts
- [ ] All real services match contracts
- [ ] No manual transformations
- [ ] Contract tests pass
- [ ] Mock tests pass

### Git
- [ ] Descriptive commit message
- [ ] Commits are focused (one logical change per commit)
- [ ] No unrelated changes included

---

## 📖 Quick Reference

### Essential Commands
```bash
# Development
npm run dev                    # Start dev server (with mocks)
npm run build                  # Production build
npm run preview                # Preview production build

# Type Checking
npm run check                  # Type check all files
npm run check:watch            # Type check in watch mode

# Testing
npm test                       # Run all tests
npm run test:contracts         # Contract tests only
npm run test:mocks             # Mock tests only
npm run test:integration       # Integration tests only
npm run test:all               # All test types sequentially

# Code Quality
npm run lint                   # Check linting
npm run format                 # Format all files
npm run format:check           # Check formatting

# Validation (placeholders)
npm run validate:contracts     # Validate contract compliance
npm run validate:mocks         # Validate mock coverage
npm run validate:seams         # Validate seams documented
npm run validate:all           # All validations

# CI
npm run ci                     # Run all CI checks
```

### File Locations
- Contracts: `/contracts/[Feature].ts`
- Mock Services: `/services/mock/[Feature]Mock.ts`
- Real Services: `/services/real/[Feature]Service.ts`
- Contract Tests: `/tests/contracts/[Feature].test.ts`
- Mock Tests: `/tests/mocks/[Feature].test.ts`
- Integration Tests: `/tests/integration/[Feature].test.ts`
- Components: `/src/lib/components/`
- Pages: `/src/routes/`

### Key Documentation
- **AGENTS.md** - AI agent instructions (READ THIS FIRST)
- **seam-driven-development.md** - Complete SDD methodology
- **SEAMSLIST.md** - All defined seams
- **CHANGELOG.md** - Version history
- **lessonslearned.md** - Project insights

### Path Aliases
```typescript
import { utils } from '$lib/utils'
import type { UserSeam } from '$contracts/User'
import { userService } from '$services/factory'
```

---

## 🎯 Success Criteria

You've successfully completed a task when:

- [ ] All tests pass (`npm run test:all`)
- [ ] Type checking passes (`npm run check`)
- [ ] Linting passes (`npm run lint`)
- [ ] No `any` type escapes
- [ ] Contracts unchanged (or new version created)
- [ ] Mocks match contracts
- [ ] Real services match contracts
- [ ] Documentation updated
- [ ] CI passes
- [ ] Integration works first try

---

**Remember**: The goal of SDD is to make integration deterministic. If you follow this checklist exactly, integration will work the first time. If it doesn't, you missed a step in this checklist.
