# Lessons Learned - TarotUpMyHeart

*This document captures insights specific to applying Seam-Driven Development (SDD) to the TarotUpMyHeart project.*

## Project Context

- **Methodology**: Seam-Driven Development (SDD)
- **Framework**: SvelteKit + TypeScript
- **AI Integration**: Grok-4-fast-reasoning (X.AI)
- **Deployment**: Vercel
- **Started**: 2025-11-07
- **Status**: Scaffolding complete, implementation pending

---

## SDD Application Insights

### What Worked Well

*To be filled during development*

**Template for entries:**
```markdown
#### [Feature/Decision Name]
- **What**: [Brief description]
- **Why it worked**: [Explanation]
- **Impact**: [Measurable result]
- **Reusable pattern**: [Yes/No - if yes, describe]
```

**Example:**
```markdown
#### Mock-First Image Upload
- **What**: Built image upload UI against mock file validation service
- **Why it worked**: Could iterate on UX without waiting for real upload implementation
- **Impact**: Saved 2 days of blocked time
- **Reusable pattern**: Yes - all file upload features should use mock-first approach
```

---

### What Didn't Work

*To be filled during development*

**Template for entries:**
```markdown
#### [Issue Name]
- **What went wrong**: [Description]
- **Context**: [When/where it happened]
- **Root cause**: [Why it failed]
- **Impact**: [What broke or was delayed]
- **Solution**: [How we fixed it]
- **Prevention**: [How to avoid in future]
```

**Example:**
```markdown
#### Contract Changed Mid-Development
- **What went wrong**: Developer modified contract after UI implementation started
- **Context**: Week 2, adding email field to UserSeam
- **Root cause**: Didn't understand contract immutability principle
- **Impact**: UI components broke, lost 4 hours refactoring
- **Solution**: Reverted contract change, created UserSeamV2 instead
- **Prevention**: Added pre-commit hook to detect contract modifications
```

---

### What We'd Do Differently

*To be filled during development*

**Template for entries:**
```markdown
#### [Decision/Approach]
- **What we did**: [Original approach]
- **What we learned**: [Insight gained]
- **What we'd do instead**: [Better approach]
- **When to apply**: [Situations where new approach is better]
```

---

## Technical Decisions

### Decision Log

*Document significant technical decisions using this template*

#### Decision: [Name]

- **Date**: YYYY-MM-DD
- **Status**: Proposed | Accepted | Rejected | Superseded
- **Context**: Why we faced this decision
- **Options Considered**:
  1. **Option A**:
     - Pros: [List benefits]
     - Cons: [List drawbacks]
  2. **Option B**:
     - Pros: [List benefits]
     - Cons: [List drawbacks]
- **Decision Made**: [What we chose]
- **Rationale**: [Why we chose it]
- **Consequences**: [Positive and negative outcomes]
- **Outcome**: [How it turned out - fill in later]
- **Lesson**: [What we learned - fill in later]

---

**Example Decision Entry:**

#### Decision: Grok API Integration Strategy

- **Date**: 2025-11-07
- **Status**: Accepted
- **Context**: Need to integrate Grok AI for both prompt generation (text) and image generation. Could build as single service or separate services.
- **Options Considered**:
  1. **Single GrokService**:
     - Pros: One API key, simpler configuration, shared error handling
     - Cons: Violates single responsibility, mixes text and image concerns
  2. **Separate Services (GrokTextService + GrokImageService)**:
     - Pros: Clear seam boundaries, independent mocking, follows SDD principles
     - Cons: Two service implementations, potential code duplication
- **Decision Made**: Separate services (GrokTextService + GrokImageService)
- **Rationale**: Better aligns with SDD - each service has one seam, easier to mock independently for parallel development
- **Consequences**: Need to implement two services but gain better testability and clearer contracts
- **Outcome**: [To be filled after implementation]
- **Lesson**: [To be filled after implementation]

---

## Seam-Specific Learnings

### Contract Design

*To be filled as contracts are defined*

**Template:**
```markdown
#### [Seam Name]
- **Challenge**: [What was hard about defining this contract]
- **Solution**: [How we solved it]
- **Pattern**: [Contract structure we settled on]
- **Lesson**: [What we learned for future contracts]
```

---

### Mock Development

*To be filled as mocks are implemented*

**Template:**
```markdown
#### [Mock Service Name]
- **Challenge**: [Difficulty in mocking]
- **Approach**: [What we tried]
- **Result**: [What worked]
- **Reusable Pattern**: [Extract for other projects]
```

**Example:**
```markdown
#### MockGrokImageService
- **Challenge**: How to mock image generation without real AI calls
- **Approach**: Used placeholder images from Lorem Picsum API with deterministic IDs
- **Result**: Realistic mock that generates unique "images" for each card
- **Reusable Pattern**: For any image generation mock, use deterministic placeholders keyed to input hash
```

---

### Integration Challenges

*To be filled during integration phase*

**Template:**
```markdown
#### [Integration Issue]
- **Issue**: [What broke during integration]
- **Root Cause**: [Why it broke]
- **Contract Problem**: [Was the contract wrong or implementation?]
- **Fix**: [Solution]
- **Prevention**: [Contract change or pattern to prevent recurrence]
```

---

## AI Coding Agent Insights

### Working with Claude

*To be filled as we use Claude for development*

**What works well:**
- [Patterns that Claude handles effectively]

**What doesn't work:**
- [Areas where Claude struggles]

**Best practices:**
- [How to get best results from Claude]

---

### Working with GitHub Copilot

*To be filled as we use Copilot*

**What works well:**
- [Patterns that Copilot handles effectively]

**What doesn't work:**
- [Areas where Copilot struggles]

**Best practices:**
- [How to get best results from Copilot]

---

### Working with Gemini

*To be filled as we use Gemini*

**What works well:**
- [Patterns that Gemini handles effectively]

**What doesn't work:**
- [Areas where Gemini struggles]

**Best practices:**
- [How to get best results from Gemini]

---

### Common AI Pitfalls

*Document AI-specific issues encountered*

**Template:**
```markdown
- **Pitfall**: [What the AI did wrong]
- **Why it happens**: [Root cause]
- **How to prevent**: [Instruction or pattern to avoid it]
```

**Example:**
```markdown
- **Pitfall**: AI modified contract during implementation
- **Why it happens**: AI doesn't understand SDD contract immutability
- **How to prevent**: Add "NEVER modify contracts in /contracts" to AGENTS.md and remind before each task
```

---

## SDD Methodology Refinements

### Improvements to SDD Process

*Document any adjustments we made to standard SDD*

**Template:**
```markdown
#### [Improvement Name]
- **Standard SDD approach**: [What the methodology says]
- **Our modification**: [What we changed]
- **Why we changed it**: [Rationale]
- **Result**: [Did it help?]
- **Recommendation**: [Should this be incorporated into seam-driven-development.md?]
```

---

### Tooling Gaps

*What tools would have helped?*

**Template:**
```markdown
#### [Tool Name/Purpose]
- **Gap**: [What was missing]
- **Impact**: [How it slowed us down]
- **Workaround**: [What we did instead]
- **Ideal tool**: [Describe desired tool]
- **Built our own?**: [Yes/No - if yes, link to it]
```

**Example:**
```markdown
#### Contract Validation Tool
- **Gap**: No automated way to verify mocks match contracts
- **Impact**: Manual verification was error-prone, caught issues late
- **Workaround**: Wrote tests manually for each contract
- **Ideal tool**: Auto-generate contract tests from TypeScript interfaces
- **Built our own?**: Yes - see /scripts/generate-contract-tests.ts
```

---

## Performance Observations

### Development Velocity

*To be filled during and after development*

**Metrics to track:**
- Time to first integration: [TBD]
- Integration success rate: [TBD]
- Debugging time percentage: [TBD]
- Contract definition time: [TBD]
- Mock implementation time: [TBD]
- Real service implementation time: [TBD]

**Comparison to expectations:**
- Expected: [Based on SDD metrics - 95% success rate, 70% faster integration]
- Actual: [To be filled]
- Analysis: [Why different, if at all]

---

### Comparison to Previous Projects

*If applicable - compare to non-SDD projects*

**Template:**
```markdown
| Metric | Previous Project | TarotUpMyHeart (SDD) | Improvement |
|--------|-----------------|----------------------|-------------|
| Time to first integration | [X days] | [Y days] | [+/-Z%] |
| Integration bugs | [X bugs] | [Y bugs] | [+/-Z%] |
| Refactoring time | [X hours] | [Y hours] | [+/-Z%] |
```

---

## Team Collaboration

### Communication Patterns

*How did we communicate around contracts?*

**What worked:**
- [Effective communication patterns]

**What didn't work:**
- [Communication failures]

**Recommendations:**
- [Patterns to adopt for future]

---

### Handling Contract Disputes

*When team disagreed on contract design*

**Template:**
```markdown
#### [Contract Name] Dispute
- **Disagreement**: [What people disagreed on]
- **Viewpoints**:
  - Option A: [Reasoning]
  - Option B: [Reasoning]
- **Resolution**: [How we decided]
- **Outcome**: [Was it the right call?]
```

---

### Onboarding New Developers

*If we onboard anyone mid-project*

**How easy was it?**
- Time to productivity: [TBD]
- What helped most: [Documentation, pairing, etc.]
- What was confusing: [Areas that needed better docs]

**Improvements needed:**
- [What would make onboarding faster]

---

## Grok AI Integration Learnings

*Specific insights about working with Grok API*

### Prompt Generation (grok-4-fast-reasoning)

**What we learned:**
- [Insights about the text model]

**Best practices:**
- [How to structure prompts for best results]

**Gotchas:**
- [Unexpected behaviors or limitations]

---

### Image Generation (grok-image-generator)

**What we learned:**
- [Insights about the image model]

**Best practices:**
- [How to structure prompts for best results]

**Gotchas:**
- [Unexpected behaviors or limitations]

---

### API Quirks

**Differences from OpenAI/Anthropic:**
- [Unique aspects of Grok API]

**Cost optimization:**
- [Strategies to reduce API costs]

**Rate limiting:**
- [How we handled rate limits]

---

## Future Improvements

### For Next Project

1. [Specific improvement to apply to future projects]
2. [Specific improvement to apply to future projects]

---

### For This Project (Phase 2)

*What to add in next iteration*

1. [Feature or improvement for this project]
2. [Feature or improvement for this project]

---

## Emergency Protocol Usage

### Times We Used Emergency Protocols

*Document any times integration failed*

**Template:**
```markdown
#### Incident: [Brief description]
- **Date**: YYYY-MM-DD
- **What failed**: [Integration that broke]
- **Which protocol step caught it**: [Contract validation? Mock tests? etc.]
- **Root cause**: [What was wrong]
- **Time to fix**: [Hours]
- **Prevention**: [How we'll prevent in future]
```

---

### Protocol Effectiveness

**Did the emergency protocols work?**
- [Analysis of protocol effectiveness]

**What's missing from the protocols?**
- [Gaps we discovered]

**Improvements to protocols:**
- [Suggested additions]

---

## Quotes & Moments

### "Aha!" Moments

*Insights that changed our understanding*

- *"[Quote or insight]"* - [Context: when, why it mattered]

---

### "Oh No!" Moments

*Things that went wrong and how we recovered*

- *"[What went wrong]"* - [Context: how we recovered, what we learned]

---

### Funny Moments

*Lighten the mood - development has humor too*

- [Funny bugs, interesting edge cases, etc.]

---

## Metrics Summary

*To be filled at project completion*

### SDD Effectiveness

- Contract immutability maintained: [Yes/No - any violations?]
- Integration success rate: [Percentage]
- Time saved vs traditional development: [Percentage or days]
- Developer satisfaction with SDD: [Scale of 1-10]

### Project Success

- Completed features: [Count]
- Bugs in production: [Count]
- Performance vs expectations: [Analysis]

---

## References

- See `/seam-driven-development.md` for full SDD methodology
- See `/SEAMSLIST.md` for project seams
- See `/CHANGELOG.md` for version history
- See `/AGENTS.md` for AI agent instructions

---

## Contributing to This Document

When adding lessons learned:

1. Use the provided templates
2. Be specific (avoid vague generalizations)
3. Include measurable impacts when possible
4. Link to related code/commits/PRs
5. Tag entries with dates
6. Update summary metrics at project milestones

**This is a living document** - update it throughout the project, not just at the end!
