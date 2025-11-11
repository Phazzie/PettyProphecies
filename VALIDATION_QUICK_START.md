# Validation Seam - Quick Start Guide

## 🚀 Quick Setup

### 1. Import and Use in API Routes

```typescript
import { validateRequest } from '@/src/middleware/validateRequest'

export default validateRequest("register", async (req, res) => {
  const { username, email, password } = req.validatedData
  // Data is validated and sanitized - ready to use!
})
```

### 2. Available Schemas

| Schema | Fields | Use Case |
|--------|--------|----------|
| `register` | username, email, password | User registration |
| `login` | email, password | User login |
| `forgotPassword` | email | Password reset request |
| `resetPassword` | token, newPassword | Password reset with token |
| `tarotReading` | spreadType, userQuestion | Tarot reading request |
| `rateReading` | readingId, rating | Rate a reading (1-5) |

### 3. Validation Rules

**Register:**
- Username: 3-20 chars, alphanumeric + underscore
- Email: Valid format, auto-trimmed and lowercased
- Password: 12+ chars with uppercase, lowercase, number, special char

**Rate Reading:**
- Rating: Integer 1-5 (auto-coerces from string)

### 4. Error Response Format

```json
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

## 🛡️ XSS Protection

All strings are automatically sanitized:

```typescript
// Input
userQuestion: 'My question <script>alert("xss")</script>'

// After validation
req.validatedData.userQuestion: 'My question'
```

## 📝 Manual Validation

```typescript
import { ValidationService } from '@/src/middleware/validateRequest'

const validator = new ValidationService()

// Validate data
const validated = await validator.validateRequest(data, "login")

// Sanitize string
const clean = validator.sanitize('<script>xss</script>')

// Sanitize object
const sanitized = validator.sanitizeObject(userInput)
```

## ✅ Test Coverage

- **96 tests** - All passing ✅
- **95.94% coverage** - Exceeds 95% requirement ✅
- **18 XSS tests** - All attack vectors covered ✅

## 📚 Full Documentation

- **Examples:** [VALIDATION_EXAMPLES.md](./VALIDATION_EXAMPLES.md)
- **Full Report:** [VALIDATION_SEAM_REPORT.md](./VALIDATION_SEAM_REPORT.md)
- **Tests:** `__tests__/schemas/` and `__tests__/middleware/`
- **Source:** `src/schemas/` and `src/middleware/validateRequest.ts`

## 🔧 Run Tests

```bash
# Run validation tests
npm test -- __tests__/schemas/ __tests__/middleware/validateRequest.test.ts

# With coverage
npm test -- __tests__/schemas/ __tests__/middleware/validateRequest.test.ts --coverage
```

---

**Status:** ✅ Production Ready | **Coverage:** 95.94% | **Tests:** 96/96 Passing
