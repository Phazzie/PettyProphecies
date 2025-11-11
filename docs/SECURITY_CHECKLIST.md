# Security Checklist

This checklist ensures the application follows security best practices before and after deployment.

## Pre-Deployment Security

### Secrets & Configuration

- [ ] No hardcoded secrets in codebase (MongoDB URIs, API keys, passwords, tokens)
- [ ] All secrets use environment variables via `process.env.*`
- [ ] `JWT_SECRET` is 32+ characters long
- [ ] `JWT_SECRET` is different between dev/staging/production environments
- [ ] `.env.local` is in `.gitignore` and not committed
- [ ] `.env.example` is up-to-date with all required/optional variables
- [ ] No secrets in git history (run `git log -S"password" --all`)
- [ ] Production secrets never shared in Slack/email/documentation
- [ ] MongoDB URI uses strong password (16+ characters, special chars)
- [ ] MongoDB database user has minimum required permissions

### Code Security

- [ ] No `eval()` or `Function()` constructor usage
- [ ] No SQL/NoSQL injection vulnerabilities (using Mongoose safely)
- [ ] All user inputs validated with Zod schemas
- [ ] No direct `innerHTML` usage (XSS risk)
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] Dependencies up-to-date (`npm audit` shows no critical issues)
- [ ] No unused dependencies that could introduce vulnerabilities
- [ ] TypeScript strict mode enabled
- [ ] No `any` types for user input handling

### Authentication & Authorization

- [ ] JWT tokens stored in httpOnly cookies (NOT localStorage)
- [ ] JWT tokens have 1 hour expiration
- [ ] Cookie has `Secure` flag (HTTPS only)
- [ ] Cookie has `SameSite=Strict` flag (CSRF protection)
- [ ] Cookie has `HttpOnly` flag (XSS protection)
- [ ] Password hashing using bcrypt with salt rounds 10+
- [ ] No passwords logged or returned in API responses
- [ ] Authentication required for protected API routes
- [ ] User ID extracted from token, not trusted from request body
- [ ] Password reset tokens expire (1 hour recommended)
- [ ] Password reset tokens are single-use
- [ ] Email verification for password reset

### Rate Limiting

- [ ] Rate limiting enabled for authentication endpoints (10 requests/15min)
- [ ] Rate limiting enabled for general API endpoints (50 requests/15min)
- [ ] Rate limiting enabled for tarot reading generation (20 requests/15min)
- [ ] Rate limiting uses Redis in production (not in-memory)
- [ ] Rate limiting by user ID for authenticated requests
- [ ] Rate limiting by IP for unauthenticated requests
- [ ] Rate limit headers returned (`X-RateLimit-*`)

### Input Validation

- [ ] All API inputs validated with Zod schemas
- [ ] Email format validated (regex + DNS check optional)
- [ ] Username length limits enforced (3-20 characters)
- [ ] Password strength requirements enforced (8+ chars, complexity)
- [ ] File upload restrictions (size, type) if applicable
- [ ] URL validation for user-provided URLs
- [ ] No unescaped user content in responses
- [ ] Content-Type validation for API requests

### Database Security

- [ ] MongoDB authentication enabled
- [ ] MongoDB network access restricted (IP whitelist)
- [ ] Database connection uses TLS/SSL
- [ ] Database user has minimum required privileges
- [ ] Sensitive fields not indexed unnecessarily
- [ ] No sensitive data in database logs
- [ ] Database backups configured and tested
- [ ] Backup encryption enabled

### API Security

- [ ] Authentication required for protected endpoints
- [ ] CORS configured (not `*` in production)
- [ ] Content Security Policy headers set
- [ ] X-Frame-Options header set (clickjacking protection)
- [ ] X-Content-Type-Options header set
- [ ] Referrer-Policy header set
- [ ] Error messages don't leak implementation details
- [ ] Stack traces not exposed in production
- [ ] API versioning strategy in place

## Post-Deployment Security

### Infrastructure

- [ ] HTTPS enforced (no HTTP access)
- [ ] TLS 1.2+ required (no SSLv3, TLS 1.0, TLS 1.1)
- [ ] Security headers verified (securityheaders.com scan)
- [ ] DNS configured correctly (SPF, DKIM for email)
- [ ] CDN/proxy configured (Vercel handles this)
- [ ] DDoS protection enabled (Vercel provides basic protection)
- [ ] Domain SSL certificate valid and auto-renewing

### Monitoring & Logging

- [ ] Error tracking enabled (Sentry)
- [ ] No sensitive data in error logs (passwords, tokens)
- [ ] Failed login attempts logged
- [ ] Rate limit violations logged
- [ ] Database connection errors logged
- [ ] API errors logged with context (user ID, endpoint, timestamp)
- [ ] Log retention policy defined (30-90 days recommended)
- [ ] Logs are encrypted at rest

### Secrets Management

- [ ] All production secrets stored in Vercel (encrypted)
- [ ] Secrets rotation schedule defined (90 days recommended)
- [ ] Access to secrets limited to authorized personnel
- [ ] 2FA enabled on all service accounts (Vercel, MongoDB Atlas, etc.)
- [ ] API keys have minimum required scopes
- [ ] Unused API keys revoked

### Dependency Management

- [ ] Regular dependency updates (`npm update`)
- [ ] Security audits run weekly (`npm audit`)
- [ ] Critical vulnerabilities patched within 24 hours
- [ ] High vulnerabilities patched within 7 days
- [ ] Dependabot or Renovate configured for automated PRs
- [ ] Lock file (`package-lock.json`) committed

### Data Protection

- [ ] Passwords hashed with bcrypt (never plain text)
- [ ] PII encrypted at rest if stored (GDPR compliance)
- [ ] Secure database connections (TLS/SSL)
- [ ] Data retention policy defined
- [ ] User data deletion process implemented (GDPR right to erasure)
- [ ] Data export process implemented (GDPR right to data portability)
- [ ] Privacy policy published and linked

### Incident Response

- [ ] Security incident response plan documented
- [ ] Contact information for security issues public (security@yourdomain.com)
- [ ] Secret rotation process documented (see `SECRETS_MANAGEMENT.md`)
- [ ] Backup and restore process documented and tested
- [ ] Team knows how to respond to breaches
- [ ] Legal/compliance team contact info available

## Ongoing Security Tasks

### Weekly

- [ ] Review application logs for suspicious activity
- [ ] Run `npm audit` and address high/critical issues
- [ ] Check Sentry for unusual error patterns
- [ ] Review rate limit logs for DDoS attempts

### Monthly

- [ ] Review user accounts for suspicious activity
- [ ] Update dependencies (`npm update`)
- [ ] Review and rotate API keys if needed
- [ ] Test backup and restore process
- [ ] Review access controls (who has access to secrets)

### Quarterly (Every 90 days)

- [ ] Rotate JWT_SECRET (users will need to re-login)
- [ ] Rotate MongoDB password
- [ ] Rotate API keys (Resend, xAI, etc.)
- [ ] Security audit of new features
- [ ] Penetration testing (if budget allows)
- [ ] Review and update security documentation

### Annually

- [ ] Full security audit by third party (if budget allows)
- [ ] Review and update incident response plan
- [ ] Review and update privacy policy
- [ ] Security training for team members
- [ ] Review compliance requirements (GDPR, CCPA, etc.)

## Security Testing

### Manual Testing

```bash
# Test authentication
curl http://localhost:3000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"wrong"}'
# Should return 401

# Test rate limiting
for i in {1..15}; do
  curl http://localhost:3000/api/auth/login \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
done
# Should return 429 after 10 requests

# Test CSRF protection
curl http://localhost:3000/api/tarot-reading \
  -X POST \
  -H "Content-Type: application/json" \
  -b "auth-token=stolen-token" \
  -H "X-CSRF-Token: wrong"
# Should return 403

# Test XSS protection
curl http://localhost:3000/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"<script>alert(1)</script>","email":"test@test.com","password":"test"}'
# Should sanitize or reject
```

### Automated Testing

```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for hardcoded secrets
grep -r "mongodb://" src/
grep -r "api.*key.*=.*['\"]" src/ -i
grep -r "sk-" src/

# Run linter (catches some security issues)
npm run lint

# Run tests (includes security tests)
npm test
```

### External Tools

```bash
# Install OWASP ZAP (penetration testing)
brew install --cask owasp-zap

# Install Gitleaks (secret scanning)
brew install gitleaks
gitleaks detect --source . --verbose

# Install git-secrets
brew install git-secrets
git secrets --scan

# Security headers test
curl -I https://yourdomain.com | grep -i "x-frame-options\|x-content-type\|strict-transport"
```

## Security Headers

Verify these headers are set (check with browser DevTools or curl):

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

These are typically configured in `next.config.js` or via middleware.

## Common Vulnerabilities Checklist

### OWASP Top 10 (2021)

- [ ] **A01: Broken Access Control** - Authentication/authorization tested
- [ ] **A02: Cryptographic Failures** - HTTPS enforced, passwords hashed
- [ ] **A03: Injection** - Input validation with Zod, Mongoose prevents NoSQL injection
- [ ] **A04: Insecure Design** - Security considered in architecture
- [ ] **A05: Security Misconfiguration** - Default passwords changed, unnecessary features disabled
- [ ] **A06: Vulnerable Components** - Dependencies up-to-date, `npm audit` clean
- [ ] **A07: Authentication Failures** - Rate limiting, secure session management
- [ ] **A08: Software and Data Integrity Failures** - Lock files committed, dependencies verified
- [ ] **A09: Security Logging Failures** - Sentry configured, critical events logged
- [ ] **A10: Server-Side Request Forgery** - User-provided URLs validated

## Compliance Considerations

### GDPR (if serving EU users)

- [ ] Privacy policy published
- [ ] Cookie consent banner (if using non-essential cookies)
- [ ] Right to erasure implemented (delete account)
- [ ] Right to data portability implemented (export data)
- [ ] Data breach notification process (72 hours)
- [ ] Data Processing Agreement with third parties
- [ ] Data retention policy defined

### CCPA (if serving California users)

- [ ] Privacy policy includes CCPA disclosures
- [ ] "Do Not Sell My Personal Information" link (if applicable)
- [ ] User data deletion process

### PCI DSS (if handling payments)

- [ ] Not applicable currently (no payment processing)
- [ ] If adding payments: Use Stripe/PayPal (do NOT store card data)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Vercel Security](https://vercel.com/docs/security)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [GDPR Compliance](https://gdpr.eu/)

## Emergency Contacts

In case of security incident:

1. **Immediate:** Rotate compromised secrets (see `SECRETS_MANAGEMENT.md`)
2. **Within 1 hour:** Notify team lead
3. **Within 24 hours:** Assess damage and notify affected users if needed
4. **Within 72 hours:** Notify authorities if GDPR applies and user data compromised

**Security Email:** security@yourdomain.com (setup recommended)
**Team Lead:** [Your contact info]
**Legal/Compliance:** [Your legal team contact]
