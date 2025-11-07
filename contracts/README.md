# Contracts Directory

This directory contains all immutable TypeScript contracts (seams) for the TarotUpMyHeart application.

## Purpose

Contracts define the boundaries between system components. Following Seam-Driven Development (SDD), contracts are defined BEFORE implementation and remain immutable once development begins.

## Structure

```
contracts/
├── types/              # Shared types used across multiple contracts
│   ├── common.ts      # Common types (ServiceResponse, ServiceError, etc.)
│   └── ...
├── [Feature].ts       # One file per seam
└── index.ts           # Barrel export of all contracts
```

## Contract Rules

1. **Immutability**: Once a contract is defined and implementation starts, it CANNOT be modified
2. **Versioning**: For breaking changes, create a new version (e.g., `UserSeamV2`)
3. **Type Safety**: No `any` types allowed, use `unknown` and validate
4. **Documentation**: Every contract must include:
   - `@purpose` comment explaining what it does
   - `@requirement` linking to requirement/user story
   - `@updated` date of last change

## Adding a New Contract

```bash
# 1. Create contract file
touch contracts/NewFeature.ts

# 2. Define interfaces
cat > contracts/NewFeature.ts << 'EOF'
/**
 * @purpose: [What this seam does]
 * @requirement: [REQUIREMENT-ID]
 * @updated: $(date +%Y-%m-%d)
 */

export interface NewFeatureInput {
  // Input fields
}

export interface NewFeatureOutput {
  // Output fields
}

export interface INewFeatureService {
  execute(input: NewFeatureInput): Promise<NewFeatureOutput>
}
EOF

# 3. Export from index.ts
echo "export * from './NewFeature'" >> contracts/index.ts

# 4. Update SEAMSLIST.md
# Document the new seam

# 5. Validate
npm run check
```

## Example Contract

```typescript
/**
 * @purpose: User authentication via email and password
 * @requirement: AUTH-001
 * @updated: 2025-11-07
 */

import type { ServiceResponse } from './types/common'

export interface LoginInput {
  email: string
  password: string
}

export interface LoginOutput {
  userId: string
  token: string
  expiresAt: Date
}

export interface IAuthService {
  login(input: LoginInput): Promise<ServiceResponse<LoginOutput>>
  logout(userId: string): Promise<void>
}
```

## References

- See `/SEAMSLIST.md` for all defined seams
- See `/seam-driven-development.md` for SDD methodology
- See `/AGENTS.md` for development guidelines
