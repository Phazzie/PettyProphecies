# GitHub Secrets Configuration Guide

## Required Secrets

### For Both Workflows (ci-cd.yml + deploy.yml)

#### MONGODB_URI (REQUIRED)
- **Purpose**: Database connection string for MongoDB Atlas
- **Format**: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
- **Get it from**: MongoDB Atlas → Clusters → Connect → Connect your application
- **Priority**: ⚠️ CRITICAL - Build will fail without this
- **Example**: `mongodb+srv://user:pass@cluster0.mongodb.net/petty-prophecies?retryWrites=true&w=majority`

#### JWT_SECRET (REQUIRED)
- **Purpose**: JSON Web Token signing for authentication
- **Format**: Random 64+ character string
- **Generate**:
  ```bash
  openssl rand -base64 64
  ```
  Or use: https://generate-secret.now.sh/64
- **Priority**: ⚠️ CRITICAL - Authentication will not work
- **Note**: NEVER commit this to git. Must be truly random and secret.

### For Vercel Deployment (deploy.yml only)

#### VERCEL_TOKEN (REQUIRED for deploy)
- **Purpose**: Authenticate with Vercel API for deployments
- **Get it from**:
  1. Go to https://vercel.com/account/tokens
  2. Click "Create Token"
  3. Give it a name (e.g., "GitHub Actions")
  4. Copy the token immediately (you won't see it again)
- **Priority**: ⚠️ CRITICAL for deployment
- **Scopes**: Needs deployment access

#### VERCEL_ORG_ID (REQUIRED for deploy)
- **Purpose**: Your Vercel organization/team ID
- **Get it from**:
  1. Go to Vercel → Settings → General
  2. Look for "Organization ID" or "Team ID"
  3. Copy the ID (looks like: `team_xxxxxxxxxxxxxxxxxxxxx`)
- **Priority**: ⚠️ CRITICAL for deployment

#### VERCEL_PROJECT_ID (REQUIRED for deploy)
- **Purpose**: Your specific Vercel project ID
- **Get it from**:
  1. Go to your Vercel project
  2. Settings → General
  3. Look for "Project ID"
  4. Copy the ID (looks like: `prj_xxxxxxxxxxxxxxxxxxxxx`)
- **Priority**: ⚠️ CRITICAL for deployment

#### NEXT_PUBLIC_APP_URL (REQUIRED for build)
- **Purpose**: Your application's public URL
- **Format**: `https://yourapp.vercel.app` or `https://yourdomain.com`
- **Priority**: HIGH - Needed for email links, API callbacks
- **Production Example**: `https://petty-prophecies.vercel.app`
- **Note**: This is public (NEXT_PUBLIC prefix) so it's safe in client code

### Optional Secrets (Enhanced Functionality)

#### XAI_API_KEY (Optional)
- **Purpose**: AI-powered tarot readings via xAI Grok
- **Get it from**: https://x.ai/api (requires xAI account)
- **Priority**: MEDIUM
- **Fallback**: Uses template-based readings if not set
- **Cost**: Pay-per-use pricing
- **Note**: App works fine without this, just uses pre-written interpretations

#### RESEND_API_KEY (Optional but highly recommended)
- **Purpose**: Email sending (password resets, welcome emails)
- **Get it from**: https://resend.com/api-keys
- **Priority**: HIGH (if you want email functionality)
- **Fallback**: Logs emails to console instead of sending
- **Cost**: Free tier: 100 emails/day, then pay-per-use
- **Note**: Without this, users can't reset passwords via email

#### UPSTASH_REDIS_REST_URL (Optional)
- **Purpose**: Distributed rate limiting with Redis
- **Get it from**:
  1. Create account at https://upstash.com
  2. Create a Redis database
  3. Go to database → REST API
  4. Copy the "UPSTASH_REDIS_REST_URL"
- **Priority**: MEDIUM
- **Fallback**: Uses in-memory rate limiting (resets on server restart)
- **Cost**: Free tier available

#### UPSTASH_REDIS_REST_TOKEN (Optional)
- **Purpose**: Authenticate with Upstash Redis
- **Get it from**: Same place as URL, copy "UPSTASH_REDIS_REST_TOKEN"
- **Priority**: MEDIUM (required if using Upstash)

#### SENTRY_AUTH_TOKEN (Optional)
- **Purpose**: Upload source maps to Sentry for better error tracking
- **Get it from**:
  1. Go to Sentry → Settings → Auth Tokens
  2. Create a new token with `project:releases` scope
- **Priority**: LOW (nice to have for debugging)
- **Note**: Sentry error tracking works without this, just no source maps

#### SENTRY_ORG (Optional)
- **Purpose**: Sentry organization slug
- **Get it from**: Your Sentry URL (e.g., `https://sentry.io/organizations/my-org/` → use `my-org`)
- **Priority**: LOW

#### SENTRY_PROJECT (Optional)
- **Purpose**: Sentry project slug
- **Get it from**: Your Sentry project URL
- **Priority**: LOW

---

## How to Add Secrets to GitHub

### Step-by-Step Instructions:

1. **Navigate to Your Repository**
   - Go to https://github.com/YOUR_USERNAME/PettyProphecies

2. **Open Settings**
   - Click the **Settings** tab (top right of repo)

3. **Find Secrets Section**
   - In the left sidebar, click **Secrets and variables** → **Actions**

4. **Add Each Secret**
   - Click **New repository secret** (green button)
   - Enter **Name** (exactly as shown above, case-sensitive)
   - Enter **Value** (paste the secret value)
   - Click **Add secret**

5. **Repeat for All Required Secrets**
   - MONGODB_URI
   - JWT_SECRET
   - NEXT_PUBLIC_APP_URL
   - VERCEL_TOKEN
   - VERCEL_ORG_ID
   - VERCEL_PROJECT_ID

### Visual Guide:
```
GitHub Repo → Settings → Secrets and variables → Actions → New repository secret
```

---

## How to Add Environment Variables to Vercel

Vercel needs the same environment variables for runtime:

### Step-by-Step Instructions:

1. **Navigate to Your Project**
   - Go to https://vercel.com/dashboard
   - Click on your PettyProphecies project

2. **Open Settings**
   - Click **Settings** tab

3. **Find Environment Variables**
   - Click **Environment Variables** in sidebar

4. **Add Each Variable**
   - Enter **Key** (variable name)
   - Enter **Value** (secret value)
   - Select **Environments**:
     - Production ✓
     - Preview ✓ (optional)
     - Development ✓ (optional)
   - Click **Save**

5. **Required Variables for Vercel**:
   - MONGODB_URI
   - JWT_SECRET
   - NEXT_PUBLIC_APP_URL
   - XAI_API_KEY (optional)
   - RESEND_API_KEY (optional)
   - UPSTASH_REDIS_REST_URL (optional)
   - UPSTASH_REDIS_REST_TOKEN (optional)

### Important Notes:
- **NEXT_PUBLIC_*** variables are exposed to the client
- Other variables are server-side only
- Changes require redeployment

---

## Verification Checklist

### GitHub Secrets (for CI/CD):
- [ ] MONGODB_URI added to GitHub Secrets
- [ ] JWT_SECRET added to GitHub Secrets (generated with openssl rand -base64 64)
- [ ] NEXT_PUBLIC_APP_URL added to GitHub Secrets
- [ ] VERCEL_TOKEN added to GitHub Secrets
- [ ] VERCEL_ORG_ID added to GitHub Secrets
- [ ] VERCEL_PROJECT_ID added to GitHub Secrets
- [ ] (Optional) XAI_API_KEY added for AI features
- [ ] (Optional) RESEND_API_KEY added for email
- [ ] (Optional) Upstash Redis credentials added

### Vercel Environment Variables:
- [ ] MONGODB_URI added to Vercel
- [ ] JWT_SECRET added to Vercel
- [ ] NEXT_PUBLIC_APP_URL added to Vercel
- [ ] (Optional) XAI_API_KEY added to Vercel
- [ ] (Optional) RESEND_API_KEY added to Vercel
- [ ] (Optional) Upstash credentials added to Vercel

---

## Testing Your Setup

### 1. Test Locally First:
```bash
# Create .env.local with all variables
cp .env.example .env.local
# Edit .env.local with real values

# Test build
npm run build

# Test dev server
npm run dev
```

### 2. Test CI/CD:
```bash
# After adding GitHub secrets, push a commit
git commit --allow-empty -m "Test CI/CD with secrets"
git push

# Watch the workflow
# Go to: https://github.com/YOUR_USERNAME/PettyProphecies/actions
```

### 3. Test Vercel Deployment:
```bash
# After adding Vercel environment variables
# Push to main branch for production deploy
git push origin main

# Or create a PR for preview deploy
```

---

## Troubleshooting

### "Secret not found" Error:
- ✅ Check secret name is **exactly** as specified (case-sensitive)
- ✅ Secret value has no leading/trailing spaces
- ✅ Re-trigger the workflow after adding secrets

### Build Fails with MongoDB Connection:
- ✅ MONGODB_URI is correct format
- ✅ IP address is whitelisted in MongoDB Atlas (allow 0.0.0.0/0 for GitHub Actions)
- ✅ Database user has correct permissions

### Deployment Succeeds but Site Doesn't Work:
- ✅ Check Vercel environment variables are set
- ✅ Check Vercel deployment logs for errors
- ✅ Verify NEXT_PUBLIC_APP_URL matches your actual URL

### "Invalid token" Errors:
- ✅ JWT_SECRET is set identically in GitHub and Vercel
- ✅ JWT_SECRET is at least 32 characters (64+ recommended)

---

## Security Best Practices

1. **Never commit secrets to git**
   - Secrets belong in GitHub Secrets and Vercel Environment Variables
   - Use .env.local for local development (gitignored)

2. **Rotate secrets periodically**
   - Change JWT_SECRET every 90 days
   - Update in both GitHub and Vercel

3. **Use least privilege**
   - Vercel token should only have deployment permissions
   - MongoDB user should only have necessary database permissions

4. **Monitor usage**
   - Check Vercel logs for unauthorized access
   - Monitor MongoDB Atlas access logs

5. **Backup critical secrets**
   - Store encrypted backups of MONGODB_URI, JWT_SECRET
   - Use a password manager (1Password, Bitwarden)

---

## Quick Reference

| Secret | Where to Add | Required? |
|--------|-------------|-----------|
| MONGODB_URI | GitHub + Vercel | ✅ Yes |
| JWT_SECRET | GitHub + Vercel | ✅ Yes |
| NEXT_PUBLIC_APP_URL | GitHub + Vercel | ✅ Yes |
| VERCEL_TOKEN | GitHub only | ✅ Yes (for deploy) |
| VERCEL_ORG_ID | GitHub only | ✅ Yes (for deploy) |
| VERCEL_PROJECT_ID | GitHub only | ✅ Yes (for deploy) |
| XAI_API_KEY | GitHub + Vercel | Optional |
| RESEND_API_KEY | GitHub + Vercel | Optional |
| UPSTASH_REDIS_REST_URL | GitHub + Vercel | Optional |
| UPSTASH_REDIS_REST_TOKEN | GitHub + Vercel | Optional |

---

## Support

- **GitHub Actions Docs**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Vercel Env Vars Docs**: https://vercel.com/docs/concepts/projects/environment-variables
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **Resend**: https://resend.com/docs
- **Upstash**: https://docs.upstash.com/

For project-specific help, create an issue in this repository.
