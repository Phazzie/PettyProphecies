# Secrets Management Guide

## Overview

This application uses environment variables for all sensitive configuration. **Never commit secrets to git.**

All secrets are loaded from environment variables and validated at startup. This guide explains how to properly manage secrets in development and production.

## Required Secrets

### JWT_SECRET
- **Purpose:** Signs and verifies JWT authentication tokens
- **Format:** Random string, minimum 32 characters
- **Generate:** `openssl rand -base64 32`
- **Example:** `cz8MRJ4xK9pL2nQ3mT5vW6yX7zA0bC1dE2fG3hI4jK5l`
- **Security:** MUST be different in production vs development
- **Validation:** Application throws error if not set
- **Used in:** `/src/middleware/auth.v2.ts`, `/src/middleware/auth.ts`

### MONGODB_URI
- **Purpose:** Database connection string
- **Format:** MongoDB connection URI
- **Get from:** MongoDB Atlas dashboard
- **Example:** `mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority`
- **Security:** Contains password - never share or commit
- **Validation:** Application throws error if not set
- **Used in:** `/src/utils/database.ts`

## Optional Secrets

### UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN
- **Purpose:** Distributed rate limiting and caching
- **When needed:** Production deployment (recommended)
- **Get from:** https://console.upstash.com/ (free tier available)
- **Fallback:** In-memory rate limiting (not recommended for multi-instance production)
- **Validation:** Warning logged if not set, graceful degradation
- **Used in:** `/src/middleware/rateLimit.v2.ts`

### SENTRY_DSN & NEXT_PUBLIC_SENTRY_DSN
- **Purpose:** Error monitoring and tracking
- **When needed:** Production deployment (recommended)
- **Get from:** https://sentry.io/ (free tier available)
- **Fallback:** Errors logged to console only
- **Validation:** No error if not set
- **Used in:** `/src/utils/sentry.ts`

### XAI_API_KEY
- **Purpose:** AI-powered tarot reading generation using xAI's Grok
- **When needed:** To enable AI features
- **Get from:** https://x.ai/
- **Fallback:** Uses template-based readings from spread definitions
- **Validation:** Warning logged if not set, graceful degradation
- **Used in:** `/src/services/aiTarot.ts`

### RESEND_API_KEY
- **Purpose:** Send transactional emails (password reset, welcome)
- **When needed:** To enable email features
- **Get from:** https://resend.com/ (free tier: 100 emails/day)
- **Fallback:** Emails not sent, logged to console instead
- **Validation:** Warning logged if not set in non-production, graceful degradation
- **Used in:** `/src/services/email.ts`

### NEXT_PUBLIC_APP_URL
- **Purpose:** Base URL for generating email links and redirects
- **Format:** Full URL including protocol
- **Example:** `https://pettyprophecies.com` (production), `http://localhost:3000` (development)
- **Default:** `http://localhost:3000`
- **Used in:** Email templates, password reset links

## Security Best Practices

### 1. Never Commit Secrets
- ✅ Use `.env.local` for local development
- ✅ Add `.env*` to `.gitignore` (already configured)
- ✅ Use `.env.example` for documentation
- ✅ Use environment variables in code
- ❌ Never hardcode secrets in code
- ❌ Never commit `.env`, `.env.local`, or `.env.production` files
- ❌ Never log secrets to console

### 2. Use Different Secrets Per Environment
- **Development:** Can use simpler secrets for convenience
- **Staging:** Use production-strength secrets
- **Production:** Must use strong, random, unique secrets
- **Never share production secrets** with development or staging

### 3. Secret Generation

**Strong JWT Secret (32+ characters):**
```bash
openssl rand -base64 32
```

**Strong Password (24+ characters):**
```bash
openssl rand -base64 24
```

**Random UUID:**
```bash
uuidgen
```

### 4. Secret Rotation

Rotate secrets regularly (every 90 days recommended):

1. Generate new secret
2. Update in Vercel/hosting provider
3. Redeploy application
4. Verify application works with new secret
5. Delete old secret
6. **For JWT_SECRET:** All users will need to re-login after rotation

### 5. Access Control

- Only give secrets to people who absolutely need them
- Use Vercel's secret management (encrypted at rest)
- Enable 2FA on all service accounts (MongoDB Atlas, Vercel, etc.)
- Use separate service accounts per environment
- Regularly audit who has access to secrets

## Local Development Setup

### 1. Create `.env.local`

```bash
# Copy example file
cp .env.example .env.local
```

### 2. Update Required Secrets

```bash
# Generate JWT secret
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.local

# Add MongoDB URI (get from MongoDB Atlas)
echo "MONGODB_URI=mongodb+srv://..." >> .env.local
```

### 3. Add Optional Secrets (as needed)

```bash
# Add xAI API key (for AI features)
echo "XAI_API_KEY=xai-..." >> .env.local

# Add Resend API key (for emails)
echo "RESEND_API_KEY=re_..." >> .env.local

# Add Upstash Redis (for distributed rate limiting)
echo "UPSTASH_REDIS_REST_URL=https://..." >> .env.local
echo "UPSTASH_REDIS_REST_TOKEN=..." >> .env.local
```

### 4. Verify Configuration

```bash
# Run the application
npm run dev

# Check for errors in console
# You should see warnings for optional services not configured
# You should NOT see errors for required services
```

## Production Deployment (Vercel)

### Method 1: Vercel CLI

```bash
# Add required secrets
vercel env add JWT_SECRET production
# Paste your secret when prompted

vercel env add MONGODB_URI production
# Paste your MongoDB URI when prompted

# Add optional secrets (as needed)
vercel env add XAI_API_KEY production
vercel env add RESEND_API_KEY production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add SENTRY_DSN production
vercel env add NEXT_PUBLIC_SENTRY_DSN production

# Redeploy to apply changes
vercel --prod
```

### Method 2: Vercel Dashboard

1. Go to your project on Vercel
2. Settings > Environment Variables
3. Add each secret:
   - Key: `JWT_SECRET`
   - Value: (paste your secret)
   - Environment: Select `Production` (and `Preview` if needed)
4. Click "Save"
5. Redeploy your application

### Environment Selection

- **Production:** Live production environment
- **Preview:** Git branches, pull requests (use production-like secrets)
- **Development:** Local development via `vercel dev` (use `.env.local` instead)

## Checking for Leaked Secrets

Run these checks regularly:

```bash
# Search for potential secrets in code
grep -r "api.*key" src/ -i
grep -r "secret" src/ -i
grep -r "password" src/ -i
grep -r "mongodb://" src/
grep -r "sk-" src/

# Check git history for secrets (dangerous!)
git log -S "password" --all
git log -S "api.*key" --all --regexp-ignore-case

# Use automated tools
npm install -g gitleaks
gitleaks detect --source . --verbose

# Or use git-secrets
brew install git-secrets
git secrets --scan
```

## If a Secret is Compromised

### Immediate Actions (within 1 hour)

1. **Rotate the secret immediately**
   - Generate new secret
   - Update in Vercel/hosting
   - Redeploy application

2. **Revoke the old secret**
   - MongoDB: Rotate database user password
   - JWT: Old tokens become invalid (users re-login)
   - API Keys: Revoke in provider dashboard

3. **Check logs for unauthorized access**
   - MongoDB Atlas: Check connection logs
   - Vercel: Check deployment and function logs
   - Sentry: Check for unusual errors

### Follow-up Actions (within 24 hours)

4. **Investigate the breach**
   - How was it leaked? (git commit, logs, error message)
   - Who had access?
   - What damage could have been done?

5. **Notify affected users if needed**
   - If user data was potentially accessed
   - Follow data breach notification laws

6. **Improve security**
   - Add additional monitoring
   - Review access controls
   - Update security documentation

## Environment Variable Validation

We validate environment variables on startup to catch configuration errors early.

### Required Variables (throw errors)
- `JWT_SECRET` - Application won't start
- `MONGODB_URI` - Application won't start

### Optional Variables (show warnings)
- `XAI_API_KEY` - Falls back to template readings
- `RESEND_API_KEY` - Falls back to console logging
- `UPSTASH_REDIS_REST_URL` - Falls back to in-memory rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Falls back to in-memory rate limiting

### Validation Logic

**Required secrets:**
```typescript
const secret = process.env.JWT_SECRET
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required')
}
```

**Optional secrets:**
```typescript
const apiKey = process.env.XAI_API_KEY
if (!apiKey) {
  console.warn('XAI_API_KEY not set - AI features disabled')
  // Continue with fallback
}
```

## Common Issues

### "JWT_SECRET not configured" error
- **Cause:** Missing `JWT_SECRET` in environment variables
- **Fix:** Add `JWT_SECRET` to `.env.local` or Vercel environment variables
- **Generate:** `openssl rand -base64 32`

### "Please define the MONGODB_URI environment variable"
- **Cause:** Missing `MONGODB_URI` in environment variables
- **Fix:** Add MongoDB connection string to `.env.local` or Vercel
- **Get from:** MongoDB Atlas dashboard > Connect > Connection String

### Emails not sending
- **Cause:** Missing `RESEND_API_KEY`
- **Expected:** Warning in console, emails logged instead
- **Fix:** Add Resend API key (optional - graceful degradation)

### AI readings using templates
- **Cause:** Missing `XAI_API_KEY`
- **Expected:** Warning in console, template readings used
- **Fix:** Add xAI API key (optional - graceful degradation)

### Rate limiting in-memory only
- **Cause:** Missing `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN`
- **Expected:** Warning in console, in-memory rate limiting used
- **Fix:** Add Upstash credentials (optional - works without Redis)
- **Production:** Recommended to use Redis for multi-instance deployments

## Testing Secrets Configuration

```bash
# Start development server
npm run dev

# Check console output for:
# ✅ No errors about JWT_SECRET or MONGODB_URI
# ⚠️  Warnings about optional services (OK)

# Test authentication
curl http://localhost:3000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Should get JWT cookie if configured correctly
```

## Resources

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [MongoDB Atlas Security](https://www.mongodb.com/docs/atlas/security/)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App - Config](https://12factor.net/config)
- [Resend API Documentation](https://resend.com/docs)
- [xAI API Documentation](https://docs.x.ai/)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
