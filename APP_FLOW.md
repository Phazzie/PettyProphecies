# PettyProphecies - Application Flow Documentation

## Overview
PettyProphecies is a passive-aggressive tarot reading web application that combines traditional tarot wisdom with snarky AI-generated interpretations. Built with Next.js 14, it features user authentication, multiple tarot spreads, and AI-powered readings using xAI's Grok model.

## Tech Stack
- **Frontend:** Next.js 14.2.33 (App Router + Pages Router hybrid), React 18, Tailwind CSS
- **Backend:** Next.js API Routes (serverless functions)
- **Database:** MongoDB with Mongoose ODM
- **AI Provider:** xAI Grok (grok-4-fast-reasoning model)
- **Authentication:** JWT with bcrypt password hashing
- **Validation:** Zod schemas
- **Testing:** Jest + React Testing Library
- **Deployment:** Vercel

---

## User Journey Flow

### 1. Landing Page → Authentication
```
User visits / (landing page)
  ↓
Sees two options:
  - Login (existing users)
  - Register (new users)
  ↓
Clicks Login or Register
  ↓
Enters credentials
  ↓
Form validated (client-side)
  ↓
POST request to /api/auth/[...auth]
  ↓
Server validates with Zod schemas
  ↓
For Registration:
  - Password hashed with bcrypt
  - User document saved to MongoDB
  - JWT token generated
  ↓
For Login:
  - Password compared with bcrypt
  - JWT token generated
  ↓
JWT token stored in localStorage (⚠️ security note: should migrate to HttpOnly cookies)
  ↓
User redirected to /tarot-reading
```

### 2. Tarot Reading Generation
```
Authenticated user lands on /tarot-reading
  ↓
ProtectedRoute component checks authentication
  ↓
If authenticated:
  - Display TarotReading component
  - Show available spreads
  ↓
User selects a spread (Single Card, Three Card, Celtic Cross)
  ↓
User clicks "Get Reading"
  ↓
Frontend makes POST /api/tarot-reading
  ↓
Backend flow:
  1. Validates spreadName with Zod
  2. Retrieves spread configuration
  3. Randomly selects required number of cards
  4. 50% chance each card is reversed
  5. Creates reading document in MongoDB
  6. Calls AI service (aiTarot.ts)
  7. AI generates passive-aggressive interpretation
  8. Returns reading with AI response
  ↓
Frontend displays:
  - Card placeholders (TarotCardPlaceholder components)
  - Card positions and meanings
  - AI interpretation
  - Rating interface
```

### 3. Rating a Reading
```
User views completed reading
  ↓
Clicks star rating (1-5)
  ↓
PUT /api/tarot-reading
  ↓
Backend updates reading document with rating
  ↓
Frontend shows confirmation
```

### 4. Viewing Reading History
```
User navigates to reading history page
  ↓
GET /api/readings (authenticated)
  ↓
Backend queries MongoDB for user's readings
  ↓
Returns sorted list of past readings
  ↓
Frontend displays reading history with:
  - Timestamp
  - Spread type
  - Rating
  - Cards drawn
```

---

## Component Hierarchy

```
App (Next.js App Router)
├── Layout
│   └── AuthProvider (Context)
│       ├── Header/Navigation
│       └── Page Content
│           ├── Landing Page (/)
│           │   ├── LoginForm
│           │   └── RegisterForm
│           │
│           ├── Tarot Reading (/tarot-reading)
│           │   └── ProtectedRoute
│           │       └── TarotReading
│           │           ├── SpreadSelector
│           │           ├── TarotCardPlaceholder (multiple)
│           │           ├── CardBack (for face-down cards)
│           │           └── RatingInterface
│           │
│           └── Reading History (/history)
│               └── ProtectedRoute
│                   └── ReadingHistory
│                       └── ReadingCard (list items)
```

---

## Authentication Flow (Detailed)

### Registration Flow
```typescript
1. User submits registration form
   {
     email: string,
     password: string,
     username: string
   }

2. Client-side validation (React form state)

3. POST /api/auth/register
   ↓
4. Middleware chain executes:
   - rateLimitMiddleware (5 requests per 15 minutes)
   - loggerMiddleware (logs request)
   ↓
5. Zod schema validation:
   const registerSchema = z.object({
     email: z.string().email(),
     password: z.string().min(8),
     username: z.string().min(3).max(30)
   })
   ↓
6. Check if user exists:
   await User.findOne({ email })
   ↓
7. Hash password:
   bcrypt.hash(password, 10)
   ↓
8. Create user document:
   const user = new User({ email, password: hashedPassword, username })
   await user.save()
   ↓
9. Generate JWT token:
   jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' })
   ↓
10. Return token to client:
    res.status(201).json({ token, user: { id, email, username } })
    ↓
11. Client stores token in localStorage
12. Client redirects to /tarot-reading
```

### Login Flow
```typescript
1. User submits login form
   { email: string, password: string }

2. POST /api/auth/login
   ↓
3. Zod validation (loginSchema)
   ↓
4. Find user by email:
   const user = await User.findOne({ email })
   ↓
5. Compare password:
   const isValid = await bcrypt.compare(password, user.password)
   ↓
6. Generate JWT token
   ↓
7. Return token + user info
   ↓
8. Client stores token and redirects
```

### Protected Route Authentication
```typescript
ProtectedRoute component:
  ↓
1. Reads token from localStorage
2. Checks if token exists
3. If no token → redirect to /
4. If token exists → decode and verify
5. If valid → render protected content
6. If invalid → clear token, redirect to /

API Route Protection:
  ↓
1. Extract token from Authorization header
2. Verify JWT signature
3. Decode userId from token
4. Fetch user from database
5. Attach user to request object
6. Continue to route handler
```

---

## Tarot Reading Generation (Detailed)

### 1. Spread Selection
Available spreads defined in `src/data/tarotSpreads.ts`:

```typescript
- Single Card: 1 position
  └── "Your Current Situation"

- Three Card: 3 positions
  └── Past, Present, Future

- Celtic Cross: 10 positions
  └── Present, Challenge, Distant Past, Recent Past, Best Outcome,
      Immediate Future, Your Attitude, External Influences,
      Hopes and Fears, Final Outcome
```

### 2. Card Drawing Algorithm
```typescript
function drawCards(count: number): DrawnCard[] {
  const availableCards = [...tarotCards] // 22 Major Arcana
  const drawn: DrawnCard[] = []

  for (let i = 0; i < count; i++) {
    // Random selection without replacement
    const randomIndex = Math.floor(Math.random() * availableCards.length)
    const card = availableCards.splice(randomIndex, 1)[0]

    // 50% chance of reversal
    const isReversed = Math.random() < 0.5

    drawn.push({ ...card, isReversed })
  }

  return drawn
}
```

### 3. AI Interpretation Flow
```typescript
POST /api/tarot-reading
  ↓
1. Validate user authentication (JWT)
2. Validate request body (Zod)
3. Get spread configuration
4. Draw cards
5. Create reading document:
   {
     userId: ObjectId,
     spread: "Single Card",
     cards: [
       { cardId: ObjectId, isReversed: boolean, position: "Your Current Situation" }
     ],
     timestamp: Date.now(),
     rating: null,
     aiResponse: null // will be populated
   }
6. Save to MongoDB (get readingId)
7. Build AI prompt:
   ↓
   const prompt = `
   You are a snarky, passive-aggressive tarot card reader...

   Spread: ${spreadName}
   Cards drawn:
   ${cards.map(card => `
     Position: ${position}
     Card: ${card.name} ${card.isReversed ? '(Reversed)' : ''}
     Upright meanings: ${card.upright.join(', ')}
     Reversed meanings: ${card.reversed.join(', ')}
     Passive-aggressive take: ${card.passiveAggressive}
   `).join('\n')}

   Provide a passive-aggressive, snarky interpretation...
   `
   ↓
8. Call xAI Grok API:
   const xai = new OpenAI({
     apiKey: process.env.XAI_API_KEY,
     baseURL: "https://api.x.ai/v1"
   })

   const completion = await xai.chat.completions.create({
     model: "grok-4-fast-reasoning",
     messages: [{ role: "user", content: prompt }],
     temperature: 0.8,
     max_tokens: 1000
   })
   ↓
9. Extract AI response:
   const aiResponse = completion.choices[0].message.content
   ↓
10. Update reading document:
    await Reading.findByIdAndUpdate(readingId, { aiResponse })
    ↓
11. Return complete reading to client:
    res.json({
      reading: {
        id: readingId,
        spread: spreadName,
        cards: drawnCards,
        aiResponse: aiResponse,
        timestamp: timestamp
      }
    })
```

### 4. Frontend Display
```typescript
TarotReading component receives response:
  ↓
1. Maps over cards array
2. Renders TarotCardPlaceholder for each card:
   <TarotCardPlaceholder
     name={card.name}
     number={card.number}
     description={card.description}
     isReversed={card.isReversed}
   />
3. Displays position labels
4. Shows AI interpretation in styled container
5. Renders star rating interface
```

---

## Database Schema

### User Model (`src/models/User.ts`)
```typescript
{
  _id: ObjectId,
  email: string (unique, required),
  password: string (hashed, required),
  username: string (required),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- email (unique)

Methods:
- pre('save'): Hashes password before saving
```

### Reading Model (`src/models/Reading.ts`)
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  spread: string (enum: ['Single Card', 'Three Card', 'Celtic Cross']),
  cards: [
    {
      cardId: ObjectId,
      name: string,
      number: number,
      isReversed: boolean,
      position: string (e.g., "Past", "Present", "Future")
    }
  ],
  aiResponse: string (nullable),
  rating: number (1-5, nullable),
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- userId
- timestamp (descending)
```

---

## API Endpoints

### Authentication
```
POST /api/auth/register
Body: { email, password, username }
Response: { token, user: { id, email, username } }

POST /api/auth/login
Body: { email, password }
Response: { token, user: { id, email, username } }
```

### Tarot Readings
```
POST /api/tarot-reading
Headers: { Authorization: 'Bearer <token>' }
Body: { spreadName: string }
Response: { reading: { id, spread, cards, aiResponse, timestamp } }

PUT /api/tarot-reading
Headers: { Authorization: 'Bearer <token>' }
Body: { readingId: string, rating: number (1-5) }
Response: { message: 'Rating updated', reading: {...} }

GET /api/readings
Headers: { Authorization: 'Bearer <token>' }
Response: { readings: [...] }
```

---

## Middleware Chain

Every API request goes through:

```typescript
1. rateLimitMiddleware
   - Tracks requests by IP
   - Allows 5 requests per 15 minutes per IP
   - Returns 429 if exceeded

2. authMiddleware (protected routes only)
   - Extracts JWT from Authorization header
   - Verifies token signature
   - Decodes userId
   - Attaches user to req.user
   - Returns 401 if invalid

3. loggerMiddleware
   - Logs request method, URL, status code
   - Uses configurable log level (from LOG_LEVEL env)

4. errorHandlerMiddleware
   - Catches all errors
   - Logs error details
   - Returns appropriate status code
   - Sanitizes error messages for production
```

---

## State Management

### Client-Side State

**AuthContext** (`src/lib/AuthContext.tsx`):
```typescript
{
  user: { id, email, username } | null,
  isAuthenticated: boolean,
  login: (token, user) => void,
  logout: () => void,
  token: string | null
}

Persisted in: localStorage
Key: 'authToken'
```

**Component State** (React hooks):
- `useApiRequest`: Generic API call hook with loading/error states
- Local component state: form inputs, UI toggles, loading states

---

## Build & Deployment Process

### Local Development
```bash
1. npm install
2. Set environment variables in .env.local:
   - MONGODB_URI
   - JWT_SECRET
   - XAI_API_KEY
   - NEXT_PUBLIC_SENTRY_DSN (optional)
3. npm run dev (starts on localhost:3000)
```

### Testing
```bash
npm test
- Runs Jest with React Testing Library
- 47 tests across 8 test suites
- Tests include:
  - Tarot card data validation
  - API request hook
  - Authentication flows
  - Component rendering
  - Middleware functionality
```

### Vercel Deployment
```
1. Push to GitHub
   ↓
2. Vercel detects Next.js project
   ↓
3. Reads vercel.json configuration
   ↓
4. Installs dependencies (npm install)
   ↓
5. Runs build command (next build)
   - Compiles TypeScript
   - Bundles client/server code
   - Optimizes assets
   - Generates static pages where possible
   ↓
6. Deploys to edge network
   - API routes → Serverless functions
   - Static assets → CDN
   - SSR pages → Edge functions
   ↓
7. Sets environment variables from vercel.json:
   - MONGODB_URI (MongoDB Atlas connection string)
   - JWT_SECRET (secure random string)
   - XAI_API_KEY (xAI API key)
   - NEXT_PUBLIC_SENTRY_DSN (error tracking)
   - LOG_LEVEL (info/warn/error)
   ↓
8. Deployment complete → Live at custom domain
```

### Environment Variables Required
```bash
# Required for production
MONGODB_URI="mongodb+srv://..."
JWT_SECRET="your-super-secret-key"
XAI_API_KEY="xai-..."

# Optional
NEXT_PUBLIC_SENTRY_DSN="https://..."
LOG_LEVEL="info"
```

---

## Security Features

### Implemented
- ✅ Password hashing (bcrypt with salt rounds: 10)
- ✅ JWT authentication (7-day expiration)
- ✅ Rate limiting (5 requests per 15 minutes)
- ✅ Input validation (Zod schemas)
- ✅ Security headers (HSTS, X-Frame-Options, CSP, etc.)
- ✅ MongoDB injection prevention (Mongoose sanitization)

### Security Concerns (To Address)
- ⚠️ JWT stored in localStorage (vulnerable to XSS - should use HttpOnly cookies)
- ⚠️ No CSRF protection
- ⚠️ Password strength requirements minimal (only 8 characters)
- ⚠️ No account lockout after failed login attempts
- ⚠️ No email verification for new accounts
- ⚠️ No password reset functionality

---

## Card Components

### TarotCardPlaceholder
Used for displaying cards in a reading:
```typescript
<TarotCardPlaceholder
  name="The Fool"
  number={0}
  description="New beginnings, innocence, spontaneity"
  isReversed={false}
  className="shadow-lg"
/>
```

Features:
- Purple/indigo gradient background
- Decorative borders with opacity effects
- Displays card name, number, and description
- Automatically rotates 180° if reversed
- Shows "Reversed" badge when applicable
- Mystical SVG overlay
- Hover scale effect
- Responsive text sizing

### CardBack
Used for face-down cards or card backs:
```typescript
<CardBack className="animate-pulse" />
```

Features:
- Indigo/purple/violet gradient
- Multiple decorative border layers
- Central mystical symbol (concentric circles + star pattern)
- Corner decorations (✦ symbols)
- Textured pattern overlay
- Consistent aspect ratio (2:3)

---

## Data Flow Diagram

```
User Browser
    ↓
  [React UI Components]
    ↓
  [AuthContext State]
    ↓
  [API Request Hook]
    ↓
    ↓ HTTP Request (with JWT)
    ↓
[Next.js API Routes]
    ↓
[Middleware Chain]
  ├── Rate Limit
  ├── Authentication
  ├── Logger
  └── Error Handler
    ↓
[Route Handler Logic]
  ├── Zod Validation
  ├── Business Logic
  └── Response Formatting
    ↓
[Database Layer]
  ├── Mongoose ODM
  └── MongoDB Atlas
    ↓
[External Services]
  └── xAI Grok API
    ↓
[Response Flow]
    ↓
[Client State Update]
    ↓
[UI Re-render]
```

---

## Future Enhancements

### High Priority
1. Migrate JWT to HttpOnly cookies
2. Implement CSRF protection
3. Add comprehensive test coverage (currently 31.48%)
4. Add email verification
5. Implement password reset flow

### Medium Priority
1. Add Minor Arcana cards (56 additional cards)
2. Implement custom spread creation
3. Add reading sharing functionality
4. Create user profile pages
5. Add tarot card images (replace placeholders)

### Low Priority
1. Dark/light theme toggle
2. Reading export (PDF/Image)
3. Social media integration
4. Community features (comments, ratings)
5. Push notifications for daily readings

---

## Common Issues & Troubleshooting

### "No Next.js version detected" on Vercel
- **Cause:** Peer dependency conflicts requiring --legacy-peer-deps
- **Solution:** Ensure no deprecated packages, remove --legacy-peer-deps flag

### Tests failing with MongoDB/BSON errors
- **Cause:** Jest can't parse ESM modules from MongoDB
- **Solution:** Add transformIgnorePatterns to jest.config.js

### "Cannot overwrite model" errors
- **Cause:** Hot Module Replacement re-registering Mongoose models
- **Solution:** Use `mongoose.models.X || mongoose.model(...)` pattern

### AI responses timing out
- **Cause:** xAI API slow or rate limited
- **Solution:** Implement retry logic, increase timeout, add loading states

### Cards not displaying correctly
- **Cause:** Missing aspect ratio or overflow hidden
- **Solution:** Ensure aspect-[2/3] and overflow-hidden classes present

---

## Performance Considerations

- API routes are serverless (cold start possible)
- MongoDB connections use caching to prevent exhaustion
- Static assets served via CDN
- Client-side rendering for interactive components
- Server-side validation prevents unnecessary database calls
- Rate limiting prevents abuse and reduces costs

---

## Conclusion

PettyProphecies is a full-stack web application demonstrating modern web development practices with Next.js, MongoDB, and AI integration. The architecture is modular, scalable, and follows security best practices (with some areas for improvement). The passive-aggressive twist on traditional tarot readings provides a unique, entertaining user experience.
