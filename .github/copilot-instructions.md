# GitHub Copilot Instructions - Passive-Aggressive Tarot

## Overview

This file provides GitHub Copilot with context for better code completions in the Passive-Aggressive Tarot Next.js application.

---

## Project Context

**Framework:** Next.js 14.2.33 (App Router)
**Language:** TypeScript 5 (strict mode)
**Styling:** Tailwind CSS 3.4.17
**Database:** MongoDB with Mongoose
**Auth:** JWT with bcrypt
**Testing:** Jest + React Testing Library

---

## Code Completion Preferences

### TypeScript
```typescript
// ✅ DO: Use strict types
interface User {
  id: string
  email: string
  username: string
}

// ❌ DON'T: Use 'any'
// exception: Logger meta parameter (documented)
```

### React Components
```typescript
// ✅ DO: Use this pattern for client components
"use client"

import { useState, useEffect } from "react"

export function ComponentName() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <LoadingSpinner />

  return <div>...</div>
}
```

### API Routes
```typescript
// ✅ DO: Use this pattern
import type { NextApiRequest, NextApiResponse } from "next"
import { rateLimitMiddleware } from "@/src/middleware/rateLimit"
import { errorHandler } from "@/src/middleware/errorHandler"
import { connectToDatabase } from "@/src/utils/database"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  // Your logic here

  res.status(200).json({ success: true })
}

export default rateLimitMiddleware(errorHandler(handler))
```

### Error Handling
```typescript
// ✅ DO: Use custom error classes
import { ValidationError, AuthenticationError } from "@/src/types/errors"

if (!email) {
  throw new ValidationError("Email is required")
}

if (!user) {
  throw new AuthenticationError("Invalid credentials")
}

// ✅ DO: Type error catches
catch (error) {
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message })
  }
  throw error
}
```

### Database Queries
```typescript
// ✅ DO: Always connect first
await connectToDatabase()

// ✅ DO: Use async/await
const user = await User.findOne({ email })

// ✅ DO: Handle not found
if (!user) {
  throw new AuthenticationError("User not found")
}
```

---

## Import Paths

```typescript
// ✅ DO: Use @ alias
import { User } from "@/src/models/User"
import { connectToDatabase } from "@/src/utils/database"
import { HomePage } from "@/components/HomePage"

// ❌ DON'T: Use relative paths for deep imports
import { User } from "../../../models/User"
```

---

## Styling Patterns

```typescript
// ✅ DO: Use Tailwind classes
<button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md text-white">
  Click me
</button>

// ✅ DO: Use Radix UI for complex components
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    Content here
  </DialogContent>
</Dialog>
```

---

## Test Patterns

```typescript
// ✅ DO: Use this test structure
import { render, screen } from "@testing-library/react"
import { ComponentName } from "@/src/components/ComponentName"

describe("ComponentName", () => {
  it("should render successfully", () => {
    render(<ComponentName />)
    expect(screen.getByText("Expected")).toBeInTheDocument()
  })

  it("should handle user interaction", async () => {
    const user = userEvent.setup()
    render(<ComponentName />)

    await user.click(screen.getByRole("button"))

    expect(screen.getByText("Result")).toBeInTheDocument()
  })
})
```

---

## Validation Pattern (TODO: Migrate all to this)

```typescript
// Future pattern (Zod)
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const result = schema.safeParse(req.body)
if (!result.success) {
  return res.status(400).json({ error: result.error })
}
```

---

## Passive-Aggressive Tone

```typescript
// ✅ DO: Use sarcasm in user-facing messages
"Logging in again? Don't you have anything better to do?"
"You haven't had any readings yet. Maybe you're avoiding the truth?"
"Too many requests. The universe isn't ready for your enthusiasm."

// ❌ DON'T: Use passive-aggressive tone in errors or logs
// These should be clear and helpful for debugging
```

---

## Common Snippets

### Create New API Route
```typescript
import type { NextApiRequest, NextApiResponse } from "next"
import { rateLimitMiddleware } from "@/src/middleware/rateLimit"
import { errorHandler } from "@/src/middleware/errorHandler"
import { connectToDatabase } from "@/src/utils/database"
import { authMiddleware } from "@/src/middleware/auth"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()
  const userId = req.userId // Added by authMiddleware

  // Your logic

  res.status(200).json({ data: result })
}

export default rateLimitMiddleware(authMiddleware(errorHandler(handler)))
```

### Create New Component
```typescript
"use client"

import { useState } from "react"

interface Props {
  // Define props
}

export function ComponentName({ }: Props) {
  return (
    <div className="">
      {/* Your JSX */}
    </div>
  )
}
```

### Create New Model
```typescript
import mongoose, { Schema, Document } from "mongoose"

export interface IModelName extends Document {
  field: string
  createdAt: Date
}

const ModelSchema = new Schema<IModelName>({
  field: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export const ModelName = mongoose.models.ModelName || mongoose.model<IModelName>("ModelName", ModelSchema)
```

### Create New Test
```typescript
import { render, screen } from "@testing-library/react"
import { ComponentName } from "@/src/components/ComponentName"

describe("ComponentName", () => {
  it("should render", () => {
    render(<ComponentName />)
  })
})
```

---

## Environment Variables

```typescript
// ✅ DO: Validate environment variables
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set")
}

// ❌ DON'T: Use fallbacks for secrets
const JWT_SECRET = process.env.JWT_SECRET || "default" // NEVER DO THIS
```

---

## Known Issues to Avoid

See TECHNICAL_DEBT.md for full list. Key ones:

```typescript
// ❌ DON'T: Store JWT in localStorage (SEC-002)
localStorage.setItem("token", token) // XSS vulnerable

// ❌ DON'T: Use manual validation (SHORTCUT-009)
if (!email || !password) { } // Migrate to Zod

// ❌ DON'T: Use 'any' type (QUAL-002)
catch (error: any) { } // Use proper error types

// ❌ DON'T: Skip tests
// Every new feature needs tests
```

---

## File Organization

```
src/
├── components/      # React components
├── contexts/        # React contexts (DEPRECATED, use lib/)
├── data/            # Static data (tarot cards, spreads)
├── hooks/           # Custom React hooks
├── lib/             # Shared libraries (AuthContext, etc.)
├── middleware/      # API middleware
├── models/          # Mongoose models
├── pages/api/       # API routes
├── types/           # TypeScript types
└── utils/           # Utility functions
```

---

## Quick Reference

**Add new dependency:**
```bash
npm install <package>
```

**Run tests:**
```bash
npm run test        # Watch mode
npm run test:ci     # CI mode
```

**Build:**
```bash
npm run build
```

**Check types:**
```bash
npx tsc --noEmit
```

---

## Copilot-Specific Tips

When suggesting completions:
- Follow existing patterns in the file
- Use TypeScript strict types
- Include error handling
- Add JSDoc comments for complex functions
- Suggest test cases when creating new functions
- Use Tailwind classes for styling
- Follow the passive-aggressive tone for user messages
- Avoid shortcuts documented in TECHNICAL_DEBT.md

---

**Last Updated:** 2025-11-05
**For:** GitHub Copilot
