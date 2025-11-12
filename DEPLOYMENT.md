# 🚀 Deployment Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Vercel account
- (Optional) Upstash Redis account
- (Optional) Sentry account

## Environment Setup

### 1. Required Services

#### MongoDB Atlas
1. Create cluster at https://cloud.mongodb.com
2. Create database user
3. Whitelist Vercel IPs or use 0.0.0.0/0
4. Copy connection string

#### Vercel
1. Sign up at https://vercel.com
2. Install CLI: `npm i -g vercel`
3. Login: `vercel login`

#### Upstash Redis (Recommended)
1. Sign up at https://upstash.com
2. Create Redis database
3. Copy REST URL and token

#### Sentry (Recommended)
1. Sign up at https://sentry.io
2. Create new project
3. Copy DSN

### 2. Local Development

```bash
# Clone repository
git clone <repo-url>
cd PettyProphecies

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in your values in .env.local

# Run development server
npm run dev
```

### 3. Vercel Deployment

#### Option A: Vercel CLI

```bash
# Link project
vercel link

# Add environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add NEXT_PUBLIC_APP_URL
# ... add all required variables

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Option B: GitHub Integration

1. Connect repository to Vercel
2. Configure environment variables in dashboard
3. Push to main branch
4. Automatic deployment

### 4. Environment Variables

Add these in Vercel dashboard (Settings → Environment Variables):

**Production:**
- MONGODB_URI
- JWT_SECRET
- NEXT_PUBLIC_APP_URL
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
- SENTRY_DSN
- NEXT_PUBLIC_SENTRY_DSN
- (Optional) XAI_API_KEY
- (Optional) RESEND_API_KEY

### 5. Post-Deployment

```bash
# Verify deployment
curl https://your-app.vercel.app/api/health

# Check logs
vercel logs

# Check indexes
npm run db:indexes
```

## Monitoring

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Sentry Dashboard**: https://sentry.io
- **Upstash Dashboard**: https://console.upstash.com
- **MongoDB Atlas**: https://cloud.mongodb.com

## Troubleshooting

### Build Fails
- Check environment variables
- Run `npm run build` locally
- Check Vercel build logs

### Database Connection Issues
- Verify MongoDB URI
- Check IP whitelist
- Verify credentials

### Rate Limiting Not Working
- Verify Redis configuration
- Check fallback to memory mode
- Review Upstash dashboard

## Security Checklist

- [ ] JWT_SECRET is 32+ characters
- [ ] MongoDB credentials secured
- [ ] Redis credentials secured
- [ ] Environment variables set
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] CSRF protection enabled
- [ ] Error monitoring active
