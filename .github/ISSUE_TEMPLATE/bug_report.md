---
name: Bug Report
about: Report a bug in TarotUpMyHeart
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

<!-- Provide a clear and concise description of the bug -->

## Seam Location

Which seam does this bug affect? (Check `/SEAMSLIST.md` for all seams)

- [ ] Image Upload Seam
- [ ] User Input Seam
- [ ] Grok Prompt Generation Seam
- [ ] Grok Image Generation Seam
- [ ] Major Arcana Data Seam
- [ ] Deck State Management Seam
- [ ] Reference Image Selection Seam
- [ ] Other (specify below)

**Seam Details**:
<!-- If "Other", specify the seam name and contract location -->

## To Reproduce

Steps to reproduce the behavior:

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

<!-- A clear and concise description of what you expected to happen -->

## Actual Behavior

<!-- A clear and concise description of what actually happens -->

## Error Messages

<!-- If applicable, paste error messages, console logs, or stack traces -->

```
Paste error messages here
```

## Environment

**Browser** (if applicable):
- Browser: [e.g., Chrome, Firefox, Safari]
- Version: [e.g., 120.0]

**System**:
- OS: [e.g., macOS 14, Windows 11, Ubuntu 22.04]
- Node version: [e.g., 20.10.0]
- npm version: [e.g., 10.2.3]

**Deployment**:
- [ ] Local development (`npm run dev`)
- [ ] Preview deployment (Vercel)
- [ ] Production deployment

## SDD Analysis

<!-- Help us understand if this is a contract issue -->

**Contract Compliance**:
- [ ] Mock service works correctly (if using mocks)
- [ ] Real service fails (if using real services)
- [ ] Both mock and real services fail
- [ ] UI issue (not related to services)

**Type Safety**:
- [ ] TypeScript error in console/terminal
- [ ] Runtime type error
- [ ] No type errors

## Screenshots

<!-- If applicable, add screenshots to help explain your problem -->

## Additional Context

<!-- Add any other context about the problem here -->

## Possible Solution

<!-- If you have suggestions on how to fix the bug, describe them here -->

---

## For Maintainers

**Root Cause Analysis** (to be filled by maintainer):
- [ ] Contract issue (contract doesn't match requirements)
- [ ] Mock implementation issue
- [ ] Real service implementation issue
- [ ] Integration issue (services don't match contract)
- [ ] UI logic issue
- [ ] External API issue (Grok)

**Fix Approach** (to be filled by maintainer):
- [ ] Fix contract (breaking change - requires new version)
- [ ] Fix mock service
- [ ] Fix real service
- [ ] Fix UI logic
- [ ] Update documentation
