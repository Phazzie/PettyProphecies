---
name: New Seam Proposal
about: Propose a new seam for the application
title: '[SEAM] '
labels: seam, enhancement
assignees: ''
---

## Seam Name

<!-- Provide a descriptive name for this seam -->

## Boundary Description

**What is the boundary this seam represents?**

- **From**: [Source - e.g., "UI Component", "User Input", "External API"]
- **To**: [Destination - e.g., "Application State", "Backend Service", "Database"]

## Purpose

<!-- Why is this seam needed? What problem does it solve? -->

## User Story / Requirement

<!-- Link to the user story or requirement that drives this seam -->

**Requirement ID**: [e.g., FEAT-123, USER-STORY-45]

**User Story**:
```
As a [type of user]
I want [goal]
So that [benefit]
```

## Input Contract

<!-- Define the input interface -->

```typescript
interface [SeamName]Input {
  // Define input fields with types
  // Include comments explaining each field
}
```

## Output Contract

<!-- Define the output interface -->

```typescript
interface [SeamName]Output {
  // Define output fields with types
  // Include comments explaining each field
}
```

## Service Interface

<!-- Define the service interface -->

```typescript
interface I[SeamName]Service {
  execute(input: [SeamName]Input): Promise<ServiceResponse<[SeamName]Output>>

  // Add any additional methods
}
```

## Error Cases

<!-- Document expected error scenarios -->

| Error Type | Error Code | Description | Retryable? | User Message |
|------------|-----------|-------------|------------|--------------|
| Validation Error | VALIDATION_FAILED | Invalid input data | No | "Please check your input" |
| Network Error | NETWORK_ERROR | API call failed | Yes | "Connection issue, please retry" |
<!-- Add more error cases -->

## Dependencies

**Which other seams does this depend on?**

- [ ] Depends on: [Seam Name] - [Why/How]
- [ ] Depends on: [Seam Name] - [Why/How]

**Which components/services will use this seam?**

- [ ] Used by: [Component/Service Name] - [How]
- [ ] Used by: [Component/Service Name] - [How]

## Priority

- [ ] Critical (blocks major functionality)
- [ ] High (important feature)
- [ ] Medium (nice to have)
- [ ] Low (future enhancement)

## Estimated Complexity

- [ ] Simple (< 1 day)
- [ ] Medium (1-3 days)
- [ ] Complex (3-5 days)
- [ ] Very Complex (> 5 days)

## Implementation Plan

Following SDD methodology:

### Phase 1: Define Contract
- [ ] Create `/contracts/[SeamName].ts`
- [ ] Define input interface
- [ ] Define output interface
- [ ] Define service interface
- [ ] Define error cases
- [ ] Export from `/contracts/index.ts`
- [ ] Validate contract compiles (`npm run check`)

### Phase 2: Document
- [ ] Add to `/SEAMSLIST.md` with full details
- [ ] Document dependencies
- [ ] Document example usage
- [ ] Update `/CHANGELOG.md`

### Phase 3: Build Mock
- [ ] Create `/services/mock/[SeamName]Mock.ts`
- [ ] Implement service interface
- [ ] Return realistic mock data
- [ ] Handle all error cases
- [ ] Add to mock service factory

### Phase 4: Test Contract
- [ ] Create `/tests/contracts/[SeamName].test.ts`
- [ ] Test mock matches contract shape
- [ ] Test all required fields present
- [ ] Test no extra fields in mock
- [ ] All contract tests pass

### Phase 5: Test Mock
- [ ] Create `/tests/mocks/[SeamName].test.ts`
- [ ] Test mock behavior
- [ ] Test error scenarios
- [ ] Test edge cases
- [ ] All mock tests pass

### Phase 6: Build UI (if applicable)
- [ ] Create UI components
- [ ] Use mock service via factory
- [ ] Handle all states (loading, success, error)
- [ ] Manual testing with mocks

### Phase 7: Implement Real Service
- [ ] Create `/services/real/[SeamName]Service.ts`
- [ ] Implement service interface (must match contract exactly)
- [ ] Add to real service factory
- [ ] Handle API authentication (if needed)
- [ ] Handle rate limiting (if needed)

### Phase 8: Test Integration
- [ ] Create `/tests/integration/[SeamName].test.ts`
- [ ] Test real service against contract
- [ ] Test with real API/service
- [ ] Integration tests pass

### Phase 9: Integrate
- [ ] Switch from mock to real in service factory
- [ ] Run integration readiness check
- [ ] Verify no `any` type escapes
- [ ] All tests pass (contract + mock + integration)

## Example Usage

<!-- Provide example code showing how this seam will be used -->

```typescript
// Example usage in a component
import { seamService } from '$services/factory'
import type { SeamInput, SeamOutput } from '$contracts/SeamName'

async function handleAction() {
  const input: SeamInput = {
    // Input data
  }

  const response = await seamService.execute(input)

  if (response.success) {
    // Handle success
    console.log(response.data)
  } else {
    // Handle error
    console.error(response.error)
  }
}
```

## Alternative Approaches Considered

<!-- If you considered other ways to solve this, describe them and why you chose this approach -->

1. **Alternative 1**:
   - Pros:
   - Cons:
   - Why not chosen:

2. **Alternative 2**:
   - Pros:
   - Cons:
   - Why not chosen:

## Additional Notes

<!-- Any other information that might be helpful -->

## References

- Related Issues: #
- Related PRs: #
- Related Documentation:
- External Resources:

---

## Acceptance Criteria

<!-- Define what "done" means for this seam -->

- [ ] Contract defined and compiles
- [ ] Documented in SEAMSLIST.md
- [ ] Mock service implemented
- [ ] Contract tests pass
- [ ] Mock tests pass
- [ ] UI built (if applicable)
- [ ] Real service implemented
- [ ] Integration tests pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Deployed to preview environment

## Definition of Done

- [ ] All SDD phases completed
- [ ] All tests passing (contract + mock + integration)
- [ ] Type checking passes (`npm run check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] Documentation complete
- [ ] CHANGELOG.md updated
- [ ] Merged to main branch
