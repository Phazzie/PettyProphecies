# Migration Guide: API Standardization v2

This guide explains how to migrate existing API endpoints to use the new standardized error handling and response format.

## Table of Contents

1. [Overview](#overview)
2. [Breaking Changes](#breaking-changes)
3. [Migration Steps](#migration-steps)
4. [Before & After Examples](#before--after-examples)
5. [Testing Migration](#testing-migration)
6. [Rollback Plan](#rollback-plan)

---

## Overview

The v2 API standardization introduces:

- **Standardized response format** (`IAPIResponse`)
- **Unified error handling** (errorHandler.v2.ts)
- **Helper functions** for responses (apiResponse.ts)
- **Consistent error classes** (seams.ts)
- **Enhanced error logging**
- **Better production security** (hides internal errors)

### Benefits

- Consistent client-side error handling
- Type-safe responses with TypeScript
- Better error logging and debugging
- Production-safe error messages
- Pagination support built-in
- CSRF and rate limit error handling

---

## Breaking Changes

### Response Format Changes

**Before:**
```json
{
  "message": "Success",
  "data": {...}
}
```

**After:**
```json
{
  "success": true,
  "data": {...},
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

### Error Response Changes

**Before:**
```json
{
  "error": {
    "message": "Error occurred",
    "code": "ValidationError"
  }
}
```

**After:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error occurred",
    "field": "email"
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

### Error Class Changes

| Old Error Class | New Error Class | New Code |
|----------------|-----------------|----------|
| `ValidationError` | `ValidationError` (from seams) | `VALIDATION_ERROR` |
| `AuthenticationError` | `AuthenticationError` (from seams) | `AUTHENTICATION_ERROR` |
| `DatabaseError` | *(remove)* → Use generic Error | `INTERNAL_ERROR` |
| `ApiError` | *(remove)* → Use specific errors | Various |

---

## Migration Steps

### Step 1: Update Imports

**Before:**
```typescript
import { errorHandler } from "../../middleware/errorHandler"
import { ValidationError, AuthenticationError } from "../../types/errors"
```

**After:**
```typescript
import { errorHandler } from "../../middleware/errorHandler.v2"
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
} from "../../errors"  // Or from "../../interfaces/seams"
import { sendSuccess, sendError, sendPaginated } from "../../utils/apiResponse"
```

### Step 2: Replace Direct res.json() Calls

**Before:**
```typescript
res.status(200).json({ message: "Success", data: result })
```

**After:**
```typescript
sendSuccess(res, result, 200)
// or simply
sendSuccess(res, result)  // defaults to 200
```

### Step 3: Update Error Throwing

**Before:**
```typescript
if (!user) {
  throw new ValidationError("User not found")
}
```

**After:**
```typescript
if (!user) {
  throw new NotFoundError("User")  // Message will be "User not found"
}
```

**With field information:**
```typescript
if (!email) {
  throw new ValidationError("Email is required", "email")
}
```

**With details:**
```typescript
if (password.length < 8) {
  throw new ValidationError(
    "Password too short",
    "password",
    { minLength: 8, provided: password.length }
  )
}
```

### Step 4: Update Pagination Responses

**Before:**
```typescript
res.status(200).json({
  readings,
  currentPage: page,
  totalPages: Math.ceil(total / limit),
  totalReadings: total,
})
```

**After:**
```typescript
sendPaginated(res, readings, total, page, limit)
```

### Step 5: Remove try-catch for Expected Errors

The v2 errorHandler will catch all thrown errors automatically.

**Before:**
```typescript
try {
  const reading = await Reading.findById(id)
  if (!reading) {
    return res.status(404).json({ error: "Not found" })
  }
  res.status(200).json({ data: reading })
} catch (error) {
  res.status(500).json({ error: "Internal error" })
}
```

**After:**
```typescript
const reading = await Reading.findById(id)
if (!reading) {
  throw new NotFoundError("Reading")
}
sendSuccess(res, reading)
```

### Step 6: Update Error Handler Middleware

**Before:**
```typescript
export default rateLimitMiddleware(errorHandler(handler))
```

**After:**
```typescript
import { errorHandler } from "../../middleware/errorHandler.v2"

export default rateLimitMiddleware(errorHandler(handler))
```

---

## Before & After Examples

### Example 1: Simple GET Endpoint

**Before:**
```typescript
import type { NextApiRequest, NextApiResponse } from "next"
import { authMiddleware } from "../../middleware/auth"
import { Reading } from "../../models/Reading"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const readings = await Reading.find({ userId: req.userId })
    res.status(200).json({ readings })
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({ message: "Internal error" })
  }
}

export default authMiddleware(handler)
```

**After:**
```typescript
import type { NextApiRequest, NextApiResponse } from "next"
import { authMiddleware } from "../../middleware/auth"
import { errorHandler } from "../../middleware/errorHandler.v2"
import { Reading } from "../../models/Reading"
import { sendSuccess } from "../../utils/apiResponse"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const readings = await Reading.find({ userId: req.userId })
  sendSuccess(res, { readings })
}

export default authMiddleware(errorHandler(handler))
```

### Example 2: POST with Validation

**Before:**
```typescript
import type { NextApiRequest, NextApiResponse } from "next"
import { ValidationError } from "../../types/errors"
import { errorHandler } from "../../middleware/errorHandler"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { email, password } = req.body

  if (!email) {
    throw new ValidationError("Email is required")
  }

  if (!password || password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters")
  }

  // Process...
  const user = await createUser({ email, password })

  res.status(201).json({
    message: "User created",
    userId: user._id
  })
}

export default errorHandler(handler)
```

**After:**
```typescript
import type { NextApiRequest, NextApiResponse } from "next"
import { ValidationError } from "../../errors"
import { errorHandler } from "../../middleware/errorHandler.v2"
import { sendSuccess } from "../../utils/apiResponse"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { email, password } = req.body

  if (!email) {
    throw new ValidationError("Email is required", "email")
  }

  if (!password || password.length < 8) {
    throw new ValidationError(
      "Password must be at least 8 characters",
      "password",
      { minLength: 8, provided: password?.length ?? 0 }
    )
  }

  // Process...
  const user = await createUser({ email, password })

  sendSuccess(res, {
    message: "User created",
    userId: user._id
  }, 201)
}

export default errorHandler(handler)
```

### Example 3: Paginated Endpoint

**Before:**
```typescript
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const page = Number.parseInt(req.query.page as string) || 1
  const limit = 10
  const skip = (page - 1) * limit

  const readings = await Reading.find({ userId: req.userId })
    .skip(skip)
    .limit(limit)
    .lean()

  const total = await Reading.countDocuments({ userId: req.userId })

  res.status(200).json({
    readings,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalReadings: total,
  })
}
```

**After:**
```typescript
import { sendPaginated } from "../../utils/apiResponse"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const page = Number.parseInt(req.query.page as string) || 1
  const limit = Number.parseInt(req.query.limit as string) || 10
  const skip = (page - 1) * limit

  const readings = await Reading.find({ userId: req.userId })
    .skip(skip)
    .limit(limit)
    .lean()

  const total = await Reading.countDocuments({ userId: req.userId })

  sendPaginated(res, readings, total, page, limit)
}
```

### Example 4: Error Handling with Multiple Error Types

**Before:**
```typescript
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { readingId } = req.body

  const reading = await Reading.findById(readingId)

  if (!reading) {
    return res.status(404).json({ error: "Reading not found" })
  }

  if (reading.userId !== req.userId) {
    return res.status(403).json({ error: "Not authorized" })
  }

  await reading.delete()

  res.status(200).json({ message: "Deleted successfully" })
}
```

**After:**
```typescript
import {
  NotFoundError,
  AuthorizationError,
} from "../../errors"
import { sendSuccess } from "../../utils/apiResponse"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { readingId } = req.body

  const reading = await Reading.findById(readingId)

  if (!reading) {
    throw new NotFoundError("Reading")
  }

  if (reading.userId !== req.userId) {
    throw new AuthorizationError("Cannot delete another user's reading")
  }

  await reading.delete()

  sendSuccess(res, { message: "Deleted successfully" })
}
```

---

## Testing Migration

### 1. Unit Tests

Ensure your tests use the new response format:

**Before:**
```typescript
expect(res._getStatusCode()).toBe(200)
const data = JSON.parse(res._getData())
expect(data.message).toBe("Success")
```

**After:**
```typescript
expect(res._getStatusCode()).toBe(200)
const response = JSON.parse(res._getData())
expect(response.success).toBe(true)
expect(response.data).toBeDefined()
expect(response.timestamp).toBeDefined()
```

### 2. Integration Tests

Update API client tests to expect new format:

```typescript
const response = await fetch('/api/endpoint')
const data = await response.json()

expect(data).toMatchObject({
  success: true,
  data: expect.any(Object),
  timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
})
```

### 3. Error Response Tests

```typescript
const response = await fetch('/api/endpoint', { method: 'POST' })
const data = await response.json()

expect(data).toMatchObject({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: expect.any(String)
  },
  timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
})
```

---

## Migration Checklist

Use this checklist for each endpoint:

- [ ] Update imports (errorHandler.v2, errors, apiResponse)
- [ ] Replace `res.json()` with `sendSuccess()` or `sendError()`
- [ ] Use appropriate error classes (ValidationError, NotFoundError, etc.)
- [ ] Add field information to ValidationError
- [ ] Add details to errors where helpful
- [ ] Update pagination to use `sendPaginated()`
- [ ] Remove unnecessary try-catch blocks
- [ ] Update error handler middleware import
- [ ] Update unit tests for new response format
- [ ] Test error scenarios
- [ ] Verify TypeScript types
- [ ] Check error logging in development
- [ ] Verify production error hiding

---

## Rollback Plan

If issues arise during migration:

### Immediate Rollback

1. **Revert middleware imports:**
   ```typescript
   // Change back to
   import { errorHandler } from "../../middleware/errorHandler"
   ```

2. **Keep both handlers available:**
   - `errorHandler` (old) at `/middleware/errorHandler.ts`
   - `errorHandler` (new) at `/middleware/errorHandler.v2.ts`

3. **Gradual migration:**
   - Migrate one endpoint at a time
   - Test thoroughly before moving to next
   - Keep old error handler until all endpoints migrated

### Compatibility Layer (Optional)

Create a wrapper to support both formats during transition:

```typescript
export function legacyResponse(res: NextApiResponse, data: any, statusCode = 200) {
  // Support old format during migration
  if (process.env.USE_LEGACY_FORMAT === 'true') {
    return res.status(statusCode).json(data)
  }
  // Use new format
  return sendSuccess(res, data, statusCode)
}
```

---

## Migration Timeline

Recommended phased approach:

### Phase 1: Preparation (Week 1)
- Review all endpoints
- Update tests to support both formats
- Deploy v2 handlers alongside v1

### Phase 2: Migration (Week 2-3)
- Migrate endpoints one at a time
- Start with low-traffic endpoints
- Monitor error logs
- Update frontend clients gradually

### Phase 3: Completion (Week 4)
- Migrate remaining high-traffic endpoints
- Remove old error handler
- Update all documentation
- Deploy final version

---

## Common Pitfalls

### 1. Forgetting to add field to ValidationError

**Wrong:**
```typescript
throw new ValidationError("Email is required")
```

**Right:**
```typescript
throw new ValidationError("Email is required", "email")
```

### 2. Using generic Error for known cases

**Wrong:**
```typescript
if (!user) {
  throw new Error("User not found")
}
```

**Right:**
```typescript
if (!user) {
  throw new NotFoundError("User")
}
```

### 3. Not using helper functions

**Wrong:**
```typescript
res.status(200).json({
  success: true,
  data: result,
  timestamp: new Date().toISOString()
})
```

**Right:**
```typescript
sendSuccess(res, result)
```

### 4. Catching errors unnecessarily

**Wrong:**
```typescript
try {
  const result = await doSomething()
  sendSuccess(res, result)
} catch (error) {
  throw error  // Unnecessary
}
```

**Right:**
```typescript
const result = await doSomething()
sendSuccess(res, result)
```

---

## Support & Questions

For migration assistance:
- Review test files in `__tests__/middleware/errorHandler.v2.test.ts`
- Check examples in `__tests__/utils/apiResponse.test.ts`
- Refer to `docs/API.md` for complete API documentation
- Consult error class tests in `__tests__/errors/index.test.ts`

---

## Summary

The v2 API standardization provides:
- **Better DX**: Consistent, predictable responses
- **Type Safety**: Full TypeScript support
- **Security**: Production-safe error messages
- **Debugging**: Enhanced error logging
- **Standards**: OpenAPI-compatible format

Following this guide ensures a smooth migration with minimal disruption to your API consumers.
