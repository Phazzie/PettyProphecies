# Pull Request

## Description

<!-- Provide a brief description of your changes -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Code quality improvement

## SDD Compliance Checklist

**Critical**: All SDD requirements must be met before merge.

### Contracts
- [ ] No existing contracts modified (or new version created: V2, V3, etc.)
- [ ] All new seams documented in `SEAMSLIST.md`
- [ ] All contracts compile without errors (`npm run check`)
- [ ] No `any` types in contracts (strict type safety maintained)

### Mocks & Services
- [ ] Mock services created/updated for any new contracts
- [ ] Mock services implement contracts exactly
- [ ] Real services implement contracts exactly (if applicable)
- [ ] No manual data transformations (or properly isolated in gateway)

### Testing
- [ ] Contract tests added/updated
- [ ] Contract tests passing (`npm run test:contracts`)
- [ ] Mock tests added/updated
- [ ] Mock tests passing (`npm run test:mocks`)
- [ ] Integration tests added/updated (if applicable)
- [ ] Integration tests passing (`npm run test:integration`)
- [ ] All tests pass (`npm test`)

### Code Quality
- [ ] Type checking passes (`npm run check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] No console.log statements (use proper logging)
- [ ] No commented-out code

### Documentation
- [ ] `CHANGELOG.md` updated (if user-facing change)
- [ ] `AGENTS.md` updated (if affects AI agent behavior)
- [ ] `README.md` updated (if user-facing change)
- [ ] `lessonslearned.md` updated (if applicable - new patterns or insights)
- [ ] Code comments added for complex logic
- [ ] JSDoc comments added for public APIs

## Testing Performed

<!-- Describe the testing you've done -->

- [ ] Tested with mocks
- [ ] Tested with real services
- [ ] Tested error cases
- [ ] Tested edge cases
- [ ] Manual testing completed

### Test Results

```
# Paste test output here
npm run test:all
```

## Screenshots/Demo

<!-- If applicable, add screenshots or demo GIFs -->

## Related Issues

<!-- Link to related issues -->

Closes #<!-- issue number -->
Related to #<!-- issue number -->

## Additional Context

<!-- Add any other context about the PR here -->

## Reviewer Notes

<!-- Anything specific you want reviewers to focus on? -->

---

## Pre-Submission Checklist

Before submitting this PR, I have:

- [ ] Read the [Seam-Driven Development](../seam-driven-development.md) methodology
- [ ] Followed the [AI agent instructions](../AGENTS.md)
- [ ] Run all tests locally and they pass
- [ ] Run `npm run check` and fixed all type errors
- [ ] Run `npm run lint` and fixed all linting errors
- [ ] Updated all relevant documentation
- [ ] Verified CI will pass (all checks above completed)

## Breaking Changes

<!-- If this includes breaking changes, describe them and the migration path -->

---

**Note**: This PR will be automatically checked by CI/CD workflows including:
- SDD Compliance (contract immutability, type safety, mock coverage)
- Tests (contract, mock, integration)
- Code Quality (linting, type checking, formatting)
- Security (vulnerability scanning)
