# Deployment Guide - Passive-Aggressive Tarot

This guide provides comprehensive instructions for deploying the Passive-Aggressive Tarot application to various platforms.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment Options](#deployment-options)
  - [Vercel (Recommended)](#vercel-deployment)
  - [Docker](#docker-deployment)
  - [Self-Hosted](#self-hosted-deployment)
- [Database Setup](#database-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

- **Node.js** 20.x or higher
- **npm** or **yarn**
- **MongoDB** database (local or cloud)
- **Git** for version control

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Configuration (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Secret (REQUIRED - Generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Node Environment
NODE_ENV=production

# Sentry (Optional - for error tracking)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Logging (Optional)
LOG_LEVEL=info
```

### Generating Secure Keys

**JWT Secret:**
```bash
openssl rand -base64 32
```

---

## Deployment Options

### Vercel Deployment (Recommended)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Login to Vercel**
```bash
vercel login
```

**Step 3: Configure Environment Variables**

In the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required variables from `.env.example`

**Step 4: Deploy**
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Automatic Deployments:**
- Connect your GitHub repository to Vercel
- Every push to `main` automatically deploys to production
- Pull requests create preview deployments

---

### Docker Deployment

**Step 1: Build the Docker Image**
```bash
docker build -t passive-aggressive-tarot:latest .
```

**Step 2: Run with Docker Compose**
```bash
# Start all services (app + MongoDB + Mongo Express)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

**Access Points:**
- Application: http://localhost:3000
- MongoDB: localhost:27017
- Mongo Express (DB Admin): http://localhost:8081

**Step 3: Production Deployment**

For production, use orchestration tools like:
- **Kubernetes**: Create deployment manifests
- **Docker Swarm**: Use stack files
- **AWS ECS**: Use task definitions
- **Azure Container Instances**

---

### Self-Hosted Deployment

**Step 1: Clone and Install**
```bash
git clone https://github.com/your-repo/PettyProphecies.git
cd PettyProphecies
npm install --legacy-peer-deps
```

**Step 2: Build**
```bash
npm run build
```

**Step 3: Start with PM2 (Process Manager)**
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "tarot-app" -- start

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

**Step 4: Configure Reverse Proxy (Nginx)**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Step 5: SSL with Let's Encrypt**
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## Database Setup

### MongoDB Atlas (Cloud - Recommended)

1. **Create Account**: https://www.mongodb.com/cloud/atlas
2. **Create Cluster**: Choose free tier for development
3. **Configure Network Access**:
   - Add your IP address
   - For production: Add deployment server IPs
4. **Create Database User**:
   - Username & password
   - Read/Write permissions
5. **Get Connection String**:
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` and `<dbname>`

**Example Connection String:**
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/passive-aggressive-tarot?retryWrites=true&w=majority
```

### Local MongoDB

**Install MongoDB:**
```bash
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongod
```

**Connection String:**
```
mongodb://localhost:27017/passive-aggressive-tarot
```

---

## CI/CD Pipeline

The project includes an advanced GitHub Actions workflow with:

### Features
- ✅ Automated testing
- ✅ Type checking
- ✅ Security scanning
- ✅ Docker image building
- ✅ AI-powered code review
- ✅ Performance testing
- ✅ Automatic deployments

### Setup

**1. Configure GitHub Secrets:**

Go to Settings → Secrets and variables → Actions

Add these secrets:
```
MONGODB_URI          - Production MongoDB connection string
JWT_SECRET           - Production JWT secret
GITHUB_TOKEN         - Automatically provided
```

**2. Workflow Triggers:**
- **Push to `main`**: Deploy to production
- **Push to `develop`**: Deploy to staging
- **Pull Requests**: Run tests, linting, and AI review
- **Manual**: Use "Run workflow" button

**3. Branch Protection:**

Configure branch protection rules for `main`:
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date

---

## Monitoring & Maintenance

### Application Monitoring

**Sentry Integration:**
```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

**Key Metrics to Monitor:**
- API response times
- Error rates
- Database connection pool
- Memory usage
- Request throughput

### Database Monitoring

**MongoDB Atlas:**
- Enable monitoring in dashboard
- Set up alerts for:
  - High connection count
  - Low storage
  - Slow queries

**Backup Strategy:**
- MongoDB Atlas: Automatic backups
- Self-hosted: Use `mongodump`

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/passive-aggressive-tarot" --out=/backup

# Restore
mongorestore --uri="mongodb://localhost:27017/passive-aggressive-tarot" /backup/passive-aggressive-tarot
```

### Log Management

**View Logs:**
```bash
# PM2
pm2 logs tarot-app

# Docker
docker-compose logs -f app

# System logs
journalctl -u nginx -f
```

**Log Levels:**
- `error`: Production issues
- `warn`: Potential problems
- `info`: General information
- `debug`: Development only

---

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, AWS ALB)
- Deploy multiple app instances
- Use MongoDB replica set

### Performance Optimization
- Enable Next.js caching
- Use CDN for static assets
- Implement Redis for session storage
- Database indexing on frequently queried fields

### Security Best Practices
- Keep dependencies updated
- Use environment variables for secrets
- Enable HTTPS everywhere
- Implement rate limiting
- Regular security audits

---

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

**Database Connection Errors:**
- Check MongoDB URI format
- Verify network access (IP whitelist)
- Confirm database user credentials
- Test connection: `mongosh "mongodb://..."`

**Port Already in Use:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Environment Variables Not Loading:**
- Ensure `.env.local` exists
- Restart development server
- Check variable names (no quotes needed)
- Verify deployment platform has vars set

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: https://nextjs.org/docs
- MongoDB Docs: https://docs.mongodb.com

---

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] MongoDB production database created
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Error monitoring (Sentry) set up
- [ ] Database backups enabled
- [ ] CI/CD pipeline tested
- [ ] Security scan completed
- [ ] Performance testing done
- [ ] Documentation updated
- [ ] Team trained on deployment process

---

**Last Updated:** $(date +%Y-%m-%d)
**Version:** 1.0.0
