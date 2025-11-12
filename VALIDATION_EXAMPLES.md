# Validation Seam - Usage Examples

## Overview

This document provides examples of how to use the Zod schema validation system with XSS sanitization that was implemented following Test-Driven Development (TDD).

## Quick Start

### 1. Using Schemas Directly

```typescript
import { registerSchema, loginSchema, tarotReadingSchema } from '@/src/schemas'

// Validate registration data
try {
  const validData = registerSchema.parse({
    username: "testuser",
    email: "test@example.com",
    password: "SecureP@ssw0rd123"
  })
  // validData is typed and validated
  console.log(validData)
} catch (error) {
  // Handle validation errors
  console.error(error)
}
```

### 2. Using Middleware in API Routes

```typescript
import { validateRequest } from '@/src/middleware/validateRequest'

// Wrap your API handler with validation
export default validateRequest("register", async (req, res) => {
  // req.validatedData contains validated and sanitized data
  const { username, email, password } = req.validatedData

  // Create user with validated data
  const user = await createUser({ username, email, password })

  res.status(201).json({ success: true, data: user })
})
```

### 3. Using ValidationService

```typescript
import { ValidationService } from '@/src/middleware/validateRequest'

const validator = new ValidationService()

// Validate data programmatically
async function validateUserInput(data: unknown) {
  try {
    const validated = await validator.validateRequest(data, "login")
    return validated
  } catch (error) {
    throw new Error(`Validation failed: ${error.message}`)
  }
}

// Sanitize a string
const clean = validator.sanitize('<script>alert("xss")</script>Safe text')
// Returns: "Safe text"

// Sanitize an object
const sanitized = validator.sanitizeObject({
  username: 'user<script>alert(1)</script>',
  bio: 'My bio <img src=x onerror=alert(2)>'
})
// All strings are sanitized
```

## Schema Reference

### Register Schema

Validates user registration with strict password requirements.

**Fields:**
- `username`: 3-20 characters, alphanumeric + underscores only
- `email`: Valid email format, trimmed and lowercased
- `password`: Minimum 12 characters with uppercase, lowercase, number, and special character

**Example:**
```typescript
import { registerSchema } from '@/src/schemas'

const result = registerSchema.parse({
  username: "john_doe",
  email: "  John@Example.com  ", // Will be trimmed and lowercased
  password: "MySecure@Pass123"
})
// Result:
// {
//   username: "john_doe",
//   email: "john@example.com",
//   password: "MySecure@Pass123"
// }
```

### Login Schema

Validates user login credentials.

**Fields:**
- `email`: Required, valid email format
- `password`: Required (no complexity check for login)

**Example:**
```typescript
import { loginSchema } from '@/src/schemas'

const result = loginSchema.parse({
  email: "user@example.com",
  password: "any-password-works"
})
```

### Forgot Password Schema

Validates password reset requests.

**Fields:**
- `email`: Required, valid email format

**Example:**
```typescript
import { forgotPasswordSchema } from '@/src/schemas'

const result = forgotPasswordSchema.parse({
  email: "user@example.com"
})
```

### Reset Password Schema

Validates password reset with token.

**Fields:**
- `token`: Required reset token
- `newPassword`: Same requirements as register password

**Example:**
```typescript
import { resetPasswordSchema } from '@/src/schemas'

const result = resetPasswordSchema.parse({
  token: "abc123xyz",
  newPassword: "NewSecure@Pass456"
})
```

### Tarot Reading Schema

Validates tarot reading requests.

**Fields:**
- `spreadType`: Required spread type
- `userQuestion`: Optional, max 500 characters, XSS sanitized

**Example:**
```typescript
import { tarotReadingSchema } from '@/src/schemas'

const result = tarotReadingSchema.parse({
  spreadType: "three-card",
  userQuestion: "What does my future hold?"
})

// Without question
const result2 = tarotReadingSchema.parse({
  spreadType: "celtic-cross"
})
```

### Rate Reading Schema

Validates reading rating submissions.

**Fields:**
- `readingId`: Required reading ID
- `rating`: Integer 1-5 (can coerce from string)

**Example:**
```typescript
import { rateReadingSchema } from '@/src/schemas'

const result = rateReadingSchema.parse({
  readingId: "507f1f77bcf86cd799439011",
  rating: 5
})

// Also accepts string numbers
const result2 = rateReadingSchema.parse({
  readingId: "507f1f77bcf86cd799439011",
  rating: "5" // Will be coerced to number 5
})
```

## XSS Sanitization

All string inputs are automatically sanitized to prevent XSS attacks.

### What Gets Sanitized

**Removed:**
- `<script>` tags
- Event handlers (`onclick`, `onerror`, etc.)
- `javascript:` protocol
- Unsafe HTML tags

**Preserved:**
- Safe HTML tags: `<p>`, `<br>`, `<strong>`, `<em>`, `<b>`, `<i>`, `<u>`
- Plain text content

### Examples

```typescript
import { sanitize, sanitizeObject } from '@/src/schemas'

// Sanitize a string
const clean1 = sanitize('<script>alert("xss")</script>Hello')
// Returns: "Hello"

const clean2 = sanitize('<img src=x onerror=alert(1)>')
// Returns: ""

const clean3 = sanitize('<p>Safe <strong>HTML</strong></p>')
// Returns: "<p>Safe <strong>HTML</strong></p>"

// Sanitize an object recursively
const sanitized = sanitizeObject({
  username: 'user<script>alert(1)</script>',
  profile: {
    bio: 'My bio <img src=x onerror=alert(2)>',
    tags: ['safe', '<script>alert(3)</script>']
  }
})
// All strings sanitized, structure preserved
```

## API Route Examples

### Registration Endpoint

```typescript
// pages/api/auth/register.ts
import { validateRequest } from '@/src/middleware/validateRequest'
import { createUser } from '@/src/services/user'

export default validateRequest("register", async (req, res) => {
  const { username, email, password } = req.validatedData

  // Data is already validated and sanitized
  const user = await createUser({ username, email, password })

  res.status(201).json({
    success: true,
    data: { userId: user._id }
  })
})
```

### Login Endpoint

```typescript
// pages/api/auth/login.ts
import { validateRequest } from '@/src/middleware/validateRequest'
import { authenticateUser } from '@/src/services/auth'

export default validateRequest("login", async (req, res) => {
  const { email, password } = req.validatedData

  const token = await authenticateUser(email, password)

  res.status(200).json({
    success: true,
    data: { token }
  })
})
```

### Tarot Reading Endpoint

```typescript
// pages/api/tarot-reading.ts
import { validateRequest } from '@/src/middleware/validateRequest'
import { generateReading } from '@/src/services/tarot'

export default validateRequest("tarotReading", async (req, res) => {
  const { spreadType, userQuestion } = req.validatedData

  // userQuestion is sanitized if provided
  const reading = await generateReading(spreadType, userQuestion)

  res.status(200).json({
    success: true,
    data: reading
  })
})
```

### Rate Reading Endpoint

```typescript
// pages/api/readings/[id]/rate.ts
import { validateRequest } from '@/src/middleware/validateRequest'
import { rateReading } from '@/src/services/readings'

export default validateRequest("rateReading", async (req, res) => {
  const { readingId, rating } = req.validatedData

  const updated = await rateReading(readingId, rating)

  res.status(200).json({
    success: true,
    data: updated
  })
})
```

## Error Handling

Validation errors are returned in a standardized format:

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username must be at least 3 characters",
    "field": "username",
    "details": {
      "username": ["Username must be at least 3 characters"]
    }
  },
  "timestamp": "2025-11-11T05:00:00.000Z"
}
```

### Handling Validation Errors in Frontend

```typescript
async function registerUser(data: RegisterData) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!result.success) {
      // Display validation errors
      console.error(result.error.message)
      console.error(result.error.details)
    }

    return result
  } catch (error) {
    console.error('Network error:', error)
  }
}
```

## Testing

All schemas and middleware have comprehensive test coverage (>95%).

### Running Tests

```bash
# Run all validation tests
npm test -- __tests__/schemas/ __tests__/middleware/validateRequest.test.ts

# Run with coverage
npm test -- __tests__/schemas/ __tests__/middleware/validateRequest.test.ts --coverage
```

### Test Coverage

- Schema tests: 97.36% coverage
- Middleware tests: 94.44% coverage
- Overall: 95.94% coverage

### Writing Tests

```typescript
import { registerSchema } from '@/src/schemas'

describe('Custom validation test', () => {
  it('should validate my custom case', () => {
    const data = {
      username: "testuser",
      email: "test@example.com",
      password: "SecureP@ssw0rd123"
    }

    expect(() => registerSchema.parse(data)).not.toThrow()
  })
})
```

## Security Features

### XSS Prevention

All user inputs are sanitized using the `xss` library with a strict whitelist.

**Protected Against:**
- Script injection
- Event handler injection
- JavaScript protocol injection
- Unsafe HTML tags

### Validation Rules

- **Email normalization**: Trimmed and lowercased
- **Password strength**: Enforced complexity requirements
- **Length limits**: Prevent DoS attacks
- **Type safety**: Zod ensures type correctness

## Migration Guide

If you have existing validation logic, migrate it to use these schemas:

### Before

```typescript
export default async function handler(req, res) {
  const { email, password } = req.body

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' })
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password too short' })
  }

  // ... rest of handler
}
```

### After

```typescript
import { validateRequest } from '@/src/middleware/validateRequest'

export default validateRequest("login", async (req, res) => {
  const { email, password } = req.validatedData
  // Data is already validated and sanitized

  // ... rest of handler
})
```

## Benefits

1. **Type Safety**: Full TypeScript support
2. **DRY**: Centralized validation logic
3. **Security**: Built-in XSS protection
4. **Testability**: 95%+ test coverage
5. **Consistency**: Standardized error responses
6. **Maintainability**: Easy to extend and modify
