# Claude Code CI - Quick Start Guide

## 🚀 Getting Started with Claude Code Automation

This guide will help you start using the Claude Code CI automation workflows immediately.

---

## Prerequisites

1. **Claude Code OAuth Token**: Stored in GitHub Secrets as `CLAUDE_CODE_OAUTH_TOKEN`
2. **Repository Permissions**: Workflows need appropriate permissions (already configured)

---

## Available Commands

### On Pull Requests

Comment on any PR to trigger these workflows:

#### 1. `/auto-fix` - Auto-Fix Simple Issues
Automatically fixes common issues found in code reviews.

**Example:**
```
/auto-fix
```

**What it fixes:**
- ✅ Typos and spelling errors
- ✅ Import organization
- ✅ Code formatting
- ✅ Linting issues
- ✅ Type annotations
- ✅ Documentation improvements

**What it skips:**
- ❌ Architectural changes
- ❌ Logic refactors
- ❌ Breaking changes

#### 2. `/create-issues` - Create Issues from Feedback
Extracts actionable items from reviews and creates GitHub issues.

**Example:**
```
/create-issues
```

**What it does:**
- 📋 Analyzes review comments
- 🏷️ Creates properly labeled issues
- 🎯 Sets priority based on severity
- 🔗 Links to TECHNICAL_DEBT.md
- 📊 Organizes by category (security, bug, enhancement, etc.)

#### 3. `/generate-tests` - Generate Missing Tests
Creates comprehensive test suites for untested code.

**Example:**
```
/generate-tests
```

**What it generates:**
- 🧪 Unit tests for components
- 🔌 API route tests
- 🛠️ Utility function tests
- ✅ Edge case coverage
- 🎭 Error handling tests

#### 4. `@claude` - General AI Assistance
Get help with any issue or PR.

**Examples:**
```
@claude can you review this PR for security issues?
@claude help me understand why this test is failing
@claude suggest improvements for this component
```

---

## Automatic Workflows

These run automatically without any commands:

### 1. PR Code Review
**Trigger:** Every PR (open/sync)
**What:** Reviews code quality, security, performance, test coverage
**Output:** Comment on PR with detailed review

### 2. Technical Debt Tracker
**Trigger:** PR merge, weekly on Sunday
**What:** Updates TECHNICAL_DEBT.md with resolved/new items
**Output:** Updated TECHNICAL_DEBT.md, summary comment

### 3. On-Demand Claude
**Trigger:** `@claude` mentions in issues/PRs
**What:** Responds to specific requests
**Output:** Direct response to the question

---

## Example Workflows

### Scenario 1: Fixing PR Review Comments

1. **Reviewer leaves comments** on your PR
2. **You comment:** `/auto-fix`
3. **Claude automatically:**
   - Fixes simple issues
   - Runs tests
   - Pushes commits
   - Reports summary

### Scenario 2: Creating Issues from Review

1. **Review contains multiple suggestions**
2. **You comment:** `/create-issues`
3. **Claude creates:**
   - Issue #1: [Security] Fix JWT storage
   - Issue #2: [Testing] Add auth tests
   - Issue #3: [Enhancement] Improve validation

### Scenario 3: Improving Test Coverage

1. **PR has new code without tests**
2. **You comment:** `/generate-tests`
3. **Claude generates:**
   - Comprehensive test suites
   - Runs tests to verify
   - Reports coverage improvement
   - Commits working tests

### Scenario 4: Technical Debt Tracking

1. **You merge a PR** that fixes a bug
2. **Claude automatically:**
   - Updates TECHNICAL_DEBT.md
   - Marks bug as resolved
   - Adds resolution date
   - Comments with metrics

---

## Best Practices

### When to Use `/auto-fix`
✅ **Good for:**
- After receiving code review
- Before requesting re-review
- Cleaning up formatting issues

❌ **Not good for:**
- Complex architectural changes
- Major refactors
- Breaking API changes

### When to Use `/create-issues`
✅ **Good for:**
- Review has multiple suggestions
- Tracking future improvements
- Converting feedback to backlog items

❌ **Not good for:**
- Single, simple fix
- Urgent issues (fix directly)
- Already have issues created

### When to Use `/generate-tests`
✅ **Good for:**
- New features without tests
- Improving coverage
- Adding edge case tests

❌ **Not good for:**
- Complex integration tests (write manually)
- Tests requiring deep domain knowledge

### When to Use `@claude`
✅ **Good for:**
- Understanding complex code
- Security review requests
- Debugging assistance
- Architecture questions

❌ **Not good for:**
- Simple questions (use docs)
- Tasks with existing commands (use specific command)

---

## Tips for Better Results

### 1. Be Specific with `@claude`
**Instead of:**
```
@claude help
```

**Try:**
```
@claude review this PR for potential security vulnerabilities in the auth flow
```

### 2. Clean Up Before `/auto-fix`
- Commit your changes first
- Resolve merge conflicts
- Ensure PR is ready for review

### 3. Review Auto-Generated Content
- Check generated tests pass
- Verify created issues make sense
- Review auto-fixed code before merging

### 4. Use Commands Iteratively
1. `/generate-tests` → Review → Merge
2. `/auto-fix` → Review fixes → Request re-review
3. `/create-issues` → Prioritize → Plan sprint

---

## Troubleshooting

### Command Not Working?

**Check:**
1. ✅ Command commented on a PR (not issue)
2. ✅ Correct syntax (e.g., `/auto-fix` not `/autofix`)
3. ✅ Workflow has necessary permissions
4. ✅ CLAUDE_CODE_OAUTH_TOKEN is set

### Workflow Failed?

**Look for:**
1. Check Actions tab for error details
2. Verify all tests pass
3. Check if there are merge conflicts
4. Review workflow logs

### Unexpected Output?

**Try:**
1. Be more specific in your request
2. Check if the PR context is clear
3. Review workflow configuration
4. Try again with refined prompt

---

## Advanced Usage

### Customizing Workflows

Edit workflow files in `.github/workflows/`:

```yaml
# Example: Change when auto-fix runs
on:
  issue_comment:
    types: [created]
  # Add more triggers...
```

### Custom Claude Prompts

Modify the `prompt:` section in workflow files:

```yaml
prompt: |
  Your custom instructions here...
  
  Be very specific about what you want Claude to do.
```

### Combining Commands

You can run multiple commands in sequence:

```
/auto-fix
```

Wait for completion, then:

```
/generate-tests
```

---

## Measuring Success

### Metrics to Track

1. **Time Savings:**
   - Time to fix review comments: Before vs After
   - Issue creation time: Manual vs Automated
   - Test writing time: Manual vs Generated

2. **Quality Improvements:**
   - Test coverage percentage
   - Number of issues in backlog
   - Technical debt items resolved

3. **Developer Experience:**
   - PR cycle time
   - Number of review iterations
   - Developer satisfaction

### Example Metrics Dashboard

```markdown
## Last Week's Automation Impact

**Auto-Fix:**
- 15 PRs processed
- 42 issues auto-fixed
- 6.5 hours saved

**Issue Creation:**
- 23 issues created
- 2 hours saved
- 100% properly categorized

**Test Generation:**
- 8 test suites generated
- Coverage: 45% → 72%
- 4 hours saved

**Technical Debt:**
- 7 items resolved
- 3 new items added
- Current total: 45 items
```

---

## Getting Help

### Documentation
- Full strategy: [CLAUDE_CODE_CI_AUTOMATION.md](CLAUDE_CODE_CI_AUTOMATION.md)
- Project architecture: [agents.md](agents.md)
- Claude instructions: [claude.md](claude.md)

### Support
- GitHub Issues: Report problems or suggest improvements
- Team Discussion: Share tips and best practices
- Claude Direct: Ask `@claude` in any issue for help

---

## Next Steps

1. ✅ **Try It:** Comment `/auto-fix` on your next PR
2. 📚 **Learn More:** Read [CLAUDE_CODE_CI_AUTOMATION.md](CLAUDE_CODE_CI_AUTOMATION.md)
3. 🎯 **Optimize:** Adjust workflows for your team's needs
4. 📊 **Measure:** Track time savings and quality improvements
5. 🚀 **Scale:** Implement more advanced workflows

---

**Happy Automating! 🤖**

---

**Last Updated:** 2025-11-12
**File:** .github/CLAUDE_QUICK_START.md
