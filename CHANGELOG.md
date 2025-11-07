# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Seams will be identified and documented in SEAMSLIST.md
- Mock services will be implemented for development
- UI components for deck generation workflow
- Real Grok API integrations

### Changed
- TBD

### Deprecated
- TBD

### Removed
- TBD

### Fixed
- TBD

### Security
- TBD

## [0.0.1] - 2025-11-07

### Added
- Initial project scaffolding with Seam-Driven Development (SDD) structure
- Complete documentation framework:
  - AGENTS.md - Universal AI agent instructions
  - seam-driven-development.md - Complete SDD methodology guide
  - SEAMSLIST.md - Seam catalog template (to be populated)
  - README.md - Project overview and quick start
  - CHANGELOG.md - Version history (this file)
  - lessonslearned.md - Project insights template
- AI agent instruction files:
  - CLAUDE.md (symlink to AGENTS.md)
  - GEMINI.md (symlink to AGENTS.md)
  - .github/copilot-instructions.md
- Environment and configuration:
  - .env.example with required variables
  - .gitignore for SvelteKit + Node.js
  - .nvmrc specifying Node.js 20
- Code quality tooling:
  - .prettierrc for code formatting
  - .eslintrc.cjs for linting
  - .editorconfig for cross-editor consistency
- SvelteKit framework setup:
  - package.json with dependencies and scripts
  - svelte.config.js with Vercel adapter
  - vite.config.ts with testing configuration
  - tsconfig.json with strict mode and path aliases
- Project structure:
  - `/contracts` directory for immutable contracts
  - `/services/mock` for mock implementations
  - `/services/real` for real implementations
  - `/src/lib` for components and utilities
  - `/tests` for contract, mock, and integration tests
- LICENSE file (MIT)

### Notes

This is the initial scaffolding release. No functional code yet - only project structure and documentation following Seam-Driven Development methodology.

**Next Steps**:
1. Define seams in SEAMSLIST.md (IDENTIFY phase)
2. Create contracts in `/contracts` (DEFINE phase)
3. Implement mock services (BUILD UI phase)
4. Implement UI components against mocks
5. Implement real Grok API services (IMPLEMENT phase)
6. Integration (INTEGRATE phase)

---

## Version History Format

### Types of Changes

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security vulnerabilities

### Version Numbering

Following [Semantic Versioning](https://semver.org/):

- **MAJOR** version (X.0.0) - Incompatible API changes
- **MINOR** version (0.X.0) - Backwards-compatible functionality
- **PATCH** version (0.0.X) - Backwards-compatible bug fixes

### Pre-1.0 Releases

Before 1.0.0, the project is in initial development. Anything may change at any time.

---

[Unreleased]: https://github.com/Phazzie/TarotUpMyHeart/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/Phazzie/TarotUpMyHeart/releases/tag/v0.0.1
