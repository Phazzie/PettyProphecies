# Contributing to Passive-Aggressive Tarot

Thank you for your interest in contributing to the Passive-Aggressive Tarot project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project aims to foster an inclusive and respectful community. Please be kind and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- MongoDB instance (local or cloud)
- Git

### Initial Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/PettyProphecies.git
   cd PettyProphecies
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

5. Configure your `.env` file with required credentials:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure random string for JWT signing
   - `XAI_API_KEY` - (Optional) xAI Grok API key for AI readings
   - `RESEND_API_KEY` - (Optional) Resend API key for emails

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in logical, atomic commits
2. Write clear commit messages following this format:
   ```
   type(scope): Brief description

   Detailed explanation of what changed and why.

   - Bullet points for specific changes
   - Reference issue numbers with #123
   ```

   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

3. Keep commits focused and small
4. Test your changes thoroughly

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode and follow tsconfig.json settings
- Avoid `any` - use proper types or `unknown`
- Document complex functions with JSDoc comments
- Use meaningful variable and function names

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Maximum line length: 100 characters
- Run `npm run lint` before committing

### File Organization

```
src/
├── components/      # React components
├── hooks/          # Custom React hooks
├── pages/          # Next.js pages and API routes
├── services/       # Business logic and external services
├── repositories/   # Data access layer
├── models/         # MongoDB models
├── middleware/     # API middleware
├── utils/          # Utility functions
└── interfaces/     # TypeScript interfaces and types
```

### Architecture Patterns

- Follow the SEAM architecture (Service, Error, Auth, Middleware)
- Use repository pattern for database access
- Keep business logic in service layer
- Use middleware for cross-cutting concerns

## Testing Requirements

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.test.ts
```

### Test Coverage Requirements

- Maintain at least 80% code coverage
- All new features must include tests
- Bug fixes should include regression tests
- Critical paths require integration tests

### Test Structure

```typescript
describe('Feature/Component Name', () => {
  describe('specific functionality', () => {
    it('should behave in expected way', () => {
      // Arrange
      const input = 'test'

      // Act
      const result = functionUnderTest(input)

      // Assert
      expect(result).toBe('expected')
    })
  })
})
```

### Test Best Practices

- Write tests before or alongside implementation (TDD encouraged)
- Use descriptive test names that explain the scenario
- Test edge cases and error conditions
- Mock external dependencies (database, APIs, etc.)
- Keep tests independent and isolated

## Pull Request Process

### Before Submitting

1. **Update your branch** with the latest from `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run the full test suite**:
   ```bash
   npm test
   ```

3. **Check code quality**:
   ```bash
   npm run lint
   npm run type-check
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Update documentation** if you changed:
   - API endpoints
   - Environment variables
   - Configuration files
   - User-facing features

### Submitting the PR

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request on GitHub with:
   - **Clear title** summarizing the change
   - **Description** explaining:
     - What changed and why
     - How to test the changes
     - Any breaking changes
     - Screenshots (for UI changes)
   - **Link related issues** using keywords:
     - `Fixes #123` - Closes the issue when PR merges
     - `Relates to #456` - References without closing

### PR Review Process

1. Automated checks must pass:
   - Tests
   - Linting
   - Type checking
   - Build

2. At least one maintainer approval required

3. Address review feedback promptly

4. Resolve conflicts by rebasing

5. Once approved, maintainers will merge your PR

## Reporting Issues

### Bug Reports

Include:
- **Clear title** describing the bug
- **Steps to reproduce** the issue
- **Expected behavior** vs **actual behavior**
- **Environment details** (OS, Node version, browser)
- **Screenshots or error logs** if applicable
- **Possible solution** if you have one

### Feature Requests

Include:
- **Clear description** of the feature
- **Use case** - why is this needed?
- **Proposed solution** (optional)
- **Alternatives considered** (optional)

### Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead, email security concerns privately to the maintainers.

## Questions?

If you have questions about contributing:
- Check existing issues and discussions
- Review the documentation in `/docs`
- Ask in the project discussions section

## Recognition

Contributors are recognized in:
- README.md Contributors section
- Release notes for significant contributions

Thank you for contributing to Passive-Aggressive Tarot! 🎴✨
