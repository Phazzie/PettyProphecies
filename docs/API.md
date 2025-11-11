# API Documentation

Version: 2.0
Last Updated: 2025-11-11

## Overview

The Petty Prophecies API provides endpoints for user authentication, tarot readings, and user data management. All API responses follow a standardized format using the `IAPIResponse` interface.

## Base URL

```
http://localhost:3000/api
```

## Response Format

All API responses follow this standardized format:

### Success Response

```typescript
{
  "success": true,
  "data": <response_data>,
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

### Error Response

```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "fieldName",  // Optional: for validation errors
    "details": {}          // Optional: additional error context
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

### Paginated Response

```typescript
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `VALIDATION_ERROR` | 400 | Request data failed validation |
| `AUTHENTICATION_ERROR` | 401 | Authentication required or invalid credentials |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `CSRF_ERROR` | 403 | Invalid or missing CSRF token |
| `NOT_FOUND` | 404 | Requested resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate email) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Rate Limiting

Rate limits are applied per IP address and action type:

- **Authentication actions** (login, register): 5 requests per 15 minutes
- **General API requests**: 100 requests per 15 minutes
- **Tarot readings**: 20 requests per hour

When rate limited, the response includes:
- HTTP Status: 429
- `Retry-After` header: seconds until limit resets
- Error details with `resetAt` timestamp

Example rate limit error:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "resetAt": "2025-11-11T12:15:00.000Z"
    }
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

## Authentication

Most endpoints require authentication using JWT tokens stored in httpOnly cookies.

### Headers

For state-modifying requests (POST, PUT, DELETE), include CSRF token:

```
X-CSRF-Token: <token>
```

Obtain CSRF token from GET requests or dedicated endpoint.

---

## Endpoints

### Authentication

#### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Authentication:** Not required

**Rate Limit:** 5 per 15 minutes (auth)

**Request Body:**

```json
{
  "username": "string (3-20 characters, alphanumeric)",
  "email": "string (valid email)",
  "password": "string (minimum 8 characters)"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "message": "User registered successfully",
    "userId": "507f1f77bcf86cd799439011"
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

**Error Responses:**

- `400 VALIDATION_ERROR`: Invalid input data
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Password must be at least 8 characters",
      "field": "password"
    },
    "timestamp": "2025-11-11T12:00:00.000Z"
  }
  ```

- `409 CONFLICT`: Email or username already exists
  ```json
  {
    "success": false,
    "error": {
      "code": "CONFLICT",
      "message": "Email already exists"
    },
    "timestamp": "2025-11-11T12:00:00.000Z"
  }
  ```

**Example:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tarotfan",
    "email": "tarot@example.com",
    "password": "securepass123"
  }'
```

---

#### Login

Authenticate user and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Authentication:** Not required

**Rate Limit:** 5 per 15 minutes (auth)

**Request Body:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "tarotfan",
      "email": "tarot@example.com"
    }
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

**Note:** JWT token is set as httpOnly cookie automatically.

**Error Responses:**

- `400 VALIDATION_ERROR`: Missing credentials
- `401 AUTHENTICATION_ERROR`: Invalid credentials
  ```json
  {
    "success": false,
    "error": {
      "code": "AUTHENTICATION_ERROR",
      "message": "Invalid email or password"
    },
    "timestamp": "2025-11-11T12:00:00.000Z"
  }
  ```

**Example:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "tarot@example.com",
    "password": "securepass123"
  }'
```

---

#### Logout

Clear authentication session.

**Endpoint:** `GET /api/auth/logout`

**Authentication:** Not required (but will clear token if present)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

**Example:**

```bash
curl -X GET http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

#### Forgot Password

Request password reset email.

**Endpoint:** `POST /api/auth/forgot-password`

**Authentication:** Not required

**Rate Limit:** 5 per 15 minutes (auth)

**Request Body:**

```json
{
  "email": "string"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

**Note:** Returns success even if email doesn't exist (security measure).

**Error Responses:**

- `400 VALIDATION_ERROR`: Invalid email format

**Example:**

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tarot@example.com"
  }'
```

---

#### Reset Password

Reset password using token from email.

**Endpoint:** `POST /api/auth/reset-password`

**Authentication:** Not required

**Rate Limit:** 5 per 15 minutes (auth)

**Request Body:**

```json
{
  "token": "string (reset token from email)",
  "password": "string (minimum 8 characters)"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

**Error Responses:**

- `400 VALIDATION_ERROR`: Invalid password format
- `401 AUTHENTICATION_ERROR`: Invalid or expired token

**Example:**

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456",
    "password": "newsecurepass123"
  }'
```

---

### Tarot Readings

#### Create Reading

Generate a new tarot reading.

**Endpoint:** `POST /api/tarot-reading`

**Authentication:** Required

**Rate Limit:** 20 per hour (reading)

**Request Body:**

```json
{
  "spreadName": "string (e.g., 'three-card', 'celtic-cross')",
  "userQuestion": "string (optional)",
  "useAI": "boolean (optional, default: true if available)"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "readingId": "507f1f77bcf86cd799439011",
    "reading": [
      {
        "name": "The Fool",
        "suit": "Major Arcana",
        "value": "0",
        "isReversed": false
      }
    ],
    "interpretation": "Your reading suggests...",
    "aiGenerated": true,
    "modelInfo": {
      "available": true,
      "model": "gpt-4",
      "provider": "openai"
    }
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

**Error Responses:**

- `400 VALIDATION_ERROR`: Invalid spread name
- `401 AUTHENTICATION_ERROR`: Not authenticated
- `429 RATE_LIMIT_EXCEEDED`: Too many readings requested

**Example:**

```bash
curl -X POST http://localhost:3000/api/tarot-reading \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -b cookies.txt \
  -d '{
    "spreadName": "three-card",
    "userQuestion": "What does my future hold?",
    "useAI": true
  }'
```

---

#### Rate Reading

Rate a previously generated reading.

**Endpoint:** `PUT /api/tarot-reading`

**Authentication:** Required

**Rate Limit:** 100 per 15 minutes (general)

**Request Body:**

```json
{
  "readingId": "string (MongoDB ObjectId)",
  "rating": "number (1-5)"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Rating updated successfully",
    "reading": {
      "_id": "507f1f77bcf86cd799439011",
      "rating": 5,
      "updatedAt": "2025-11-11T12:00:00.000Z"
    }
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

**Error Responses:**

- `400 VALIDATION_ERROR`: Invalid rating or readingId
- `401 AUTHENTICATION_ERROR`: Not authenticated
- `404 NOT_FOUND`: Reading not found or doesn't belong to user

**Example:**

```bash
curl -X PUT http://localhost:3000/api/tarot-reading \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -b cookies.txt \
  -d '{
    "readingId": "507f1f77bcf86cd799439011",
    "rating": 5
  }'
```

---

### User Data

#### Get User Readings

Retrieve paginated list of user's past readings.

**Endpoint:** `GET /api/user/readings`

**Authentication:** Required

**Rate Limit:** 100 per 15 minutes (general)

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "spreadName": "three-card",
        "interpretation": "Your reading suggests...",
        "rating": 5,
        "createdAt": "2025-11-10T12:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

**Error Responses:**

- `401 AUTHENTICATION_ERROR`: Not authenticated

**Example:**

```bash
curl -X GET "http://localhost:3000/api/user/readings?page=1&limit=10" \
  -b cookies.txt
```

---

## CSRF Protection

State-modifying requests (POST, PUT, DELETE) require CSRF token protection.

### Obtaining CSRF Token

CSRF tokens can be obtained from:
1. Response headers of GET requests
2. Initial page load (embedded in HTML)
3. Dedicated endpoint (if implemented)

### Using CSRF Token

Include the token in the `X-CSRF-Token` header for all POST, PUT, DELETE requests:

```bash
curl -X POST http://localhost:3000/api/tarot-reading \
  -H "X-CSRF-Token: your-csrf-token" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{ "spreadName": "three-card" }'
```

**Error Response for Missing/Invalid CSRF:**

```json
{
  "success": false,
  "error": {
    "code": "CSRF_ERROR",
    "message": "Invalid CSRF token"
  },
  "timestamp": "2025-11-11T12:00:00.000Z"
}
```

---

## Common Workflows

### New User Registration and First Reading

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "new@example.com",
    "password": "secure123"
  }'

# 2. Login (saves cookie)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "new@example.com",
    "password": "secure123"
  }'

# 3. Get CSRF token (from login response or GET request)

# 4. Create reading
curl -X POST http://localhost:3000/api/tarot-reading \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -b cookies.txt \
  -d '{
    "spreadName": "three-card",
    "userQuestion": "What should I focus on?"
  }'

# 5. Rate the reading
curl -X PUT http://localhost:3000/api/tarot-reading \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token>" \
  -b cookies.txt \
  -d '{
    "readingId": "507f1f77bcf86cd799439011",
    "rating": 5
  }'
```

### Viewing Reading History

```bash
# Get first page
curl -X GET "http://localhost:3000/api/user/readings?page=1" \
  -b cookies.txt

# Get specific page
curl -X GET "http://localhost:3000/api/user/readings?page=2&limit=20" \
  -b cookies.txt
```

---

## Status Codes Summary

| Status Code | Meaning |
|------------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Insufficient permissions or CSRF error |
| 404 | Not Found - Resource doesn't exist |
| 405 | Method Not Allowed - HTTP method not supported |
| 409 | Conflict - Resource conflict (duplicate) |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Error Handling

All errors follow the standardized format:

```typescript
{
  success: false,
  error: {
    code: APIErrorCode,
    message: string,
    field?: string,        // For validation errors
    details?: {            // Additional context
      resetAt?: string,    // For rate limit errors
      originalMessage?: string  // In development only
    }
  },
  timestamp: string (ISO 8601)
}
```

### Client-Side Error Handling Example

```javascript
async function makeRequest() {
  try {
    const response = await fetch('/api/tarot-reading', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({ spreadName: 'three-card' })
    })

    const data = await response.json()

    if (!data.success) {
      // Handle different error types
      switch (data.error.code) {
        case 'VALIDATION_ERROR':
          showFieldError(data.error.field, data.error.message)
          break
        case 'AUTHENTICATION_ERROR':
          redirectToLogin()
          break
        case 'RATE_LIMIT_EXCEEDED':
          const resetAt = new Date(data.error.details.resetAt)
          showRateLimitMessage(resetAt)
          break
        default:
          showGenericError(data.error.message)
      }
      return
    }

    // Handle success
    displayReading(data.data)
  } catch (error) {
    // Network error
    showNetworkError()
  }
}
```

---

## Versioning

Current API Version: **2.0**

The API follows semantic versioning. Breaking changes will increment the major version number.

---

## Support

For issues or questions, please refer to the project repository or contact the development team.
