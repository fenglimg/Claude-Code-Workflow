# Chapter 18: Testing Strategy

> **Part**: IX - Testing and Quality
> **Version**: 1.0
> **Last Updated**: 2025-02-18

---

## Overview

CCW employs a comprehensive testing strategy following the **testing pyramid** principle. This chapter analyzes the test distribution, frameworks, and best practices across unit, integration, and E2E testing layers.

### Test Pyramid Overview

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲           ~5 tests (Playwright)
                 ╱──────╲
                ╱        ╲
               ╱Integration╲      ~30 tests (Jest)
              ╱────────────╲
             ╱              ╲
            ╱    Unit Tests  ╲    ~110 tests (Vitest/Jest)
           ╱──────────────────╲
```

### Test Statistics

| Layer | Count | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| Unit Tests | ~110 | Vitest / Jest | 80% |
| Integration Tests | ~30 | Jest | 60% |
| E2E Tests | ~45 | Playwright | Critical paths |
| Security Tests | 4 | Custom | 100% pass |
| Visual Tests | ~50 | Playwright | UI regression |

---

## Architecture Blind Spot

> **Question 18.1**: Why does CCW use multiple test frameworks (Vitest, Jest, Playwright) instead of standardizing on one?

<details>
<summary>Design Rationale</summary>

Each framework serves different purposes:

| Framework | Use Case | Rationale |
|-----------|----------|-----------|
| **Vitest** | Frontend unit tests | Vite-native, fast HMR, ESM support |
| **Jest** | Backend unit/integration tests | Mature ecosystem, snapshot testing |
| **Playwright** | E2E tests | Cross-browser, auto-wait, trace viewer |

**Key Insight**: Using the right tool for each layer maximizes developer experience and test reliability. Vitest's tight Vite integration makes frontend testing instant, while Jest's maturity suits backend testing.

</details>

---

## Testing Pyramid Analysis

### Layer 1: Unit Tests (~110 tests)

#### Frontend Unit Tests

Located in `ccw/frontend/src/**/*.test.ts(x)`:

| Category | Count | Location |
|----------|-------|----------|
| Store Tests | 3 | `stores/__tests__/` |
| Component Tests | 15 | `components/**/*.test.tsx` |
| Page Tests | 8 | `pages/**/*.test.tsx` |

**Example: Store Unit Test**

```typescript
// ccw/frontend/src/stores/__tests__/notificationStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore, selectToasts } from '../notificationStore';

describe('NotificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({ toasts: [] });
  });

  it('should add a toast', () => {
    const { addToast } = useNotificationStore.getState();
    addToast({ type: 'info', title: 'Test' });
    
    const toasts = selectToasts(useNotificationStore.getState());
    expect(toasts).toHaveLength(1);
    expect(toasts[0].title).toBe('Test');
  });

  it('should respect max toasts limit', () => {
    const store = useNotificationStore.getState();
    for (let i = 0; i < 10; i++) {
      store.addToast({ type: 'info', title: `Toast ${i}` });
    }
    
    const toasts = selectToasts(useNotificationStore.getState());
    expect(toasts.length).toBeLessThanOrEqual(store.maxToasts);
  });
});
```

#### Backend Unit Tests

Located in `ccw/tests/*.test.ts`:

| Category | Count | Focus |
|----------|-------|-------|
| Core Logic | 25 | Business rules |
| Utilities | 20 | Helper functions |
| Services | 15 | Service classes |
| Types | 10 | Type guards |

**Key Test Files**:

| File | Purpose |
|------|---------|
| `cli-command.test.ts` | CLI command parsing |
| `cli-prompt-parsing.test.ts` | Prompt template parsing |
| `csrf-manager.test.ts` | CSRF token management |
| `token-manager.test.ts` | API token handling |
| `embedding-client.test.ts` | Embedding API client |
| `smart-search.test.ts` | Search functionality |

### Layer 2: Integration Tests (~30 tests)

Located in `ccw/tests/integration/`:

| Test File | Focus | Dependencies |
|-----------|-------|--------------|
| `cli-routes.test.ts` | CLI API endpoints | Express server |
| `session-routes.test.ts` | Session management | SQLite |
| `memory-routes.test.ts` | Memory operations | Vector DB |
| `graph-routes.test.ts` | Code graph queries | CodexLens |
| `skills-routes.test.ts` | Skill execution | MCP |
| `cli-executor/*.test.ts` | CLI tool orchestration | Multi-tool |
| `semantic-search.test.ts` | Semantic search | Embeddings |

**Integration Test Patterns**:

```typescript
// ccw/tests/integration/session-routes.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createServer } from '../../src/core/server';

describe('Session Routes Integration', () => {
  let server: Express;

  beforeAll(async () => {
    server = await createServer({ testMode: true });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('POST /api/sessions should create a new session', async () => {
    const response = await request(server)
      .post('/api/sessions')
      .send({ projectPath: '/test/project' })
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.status).toBe('pending');
  });

  it('GET /api/sessions/:id should return session details', async () => {
    // Create session first
    const createRes = await request(server)
      .post('/api/sessions')
      .send({ projectPath: '/test/project' });

    const sessionId = createRes.body.data.id;

    // Fetch session
    const response = await request(server)
      .get(`/api/sessions/${sessionId}`)
      .expect(200);

    expect(response.body.data.id).toBe(sessionId);
  });
});
```

### Layer 3: E2E Tests (~45 tests)

Located in `ccw/frontend/tests/e2e/*.spec.ts`:

| Category | Files | Focus |
|----------|-------|-------|
| Navigation | 3 | Page routing |
| CRUD Operations | 5 | Create/Read/Update/Delete |
| Dashboard | 4 | Dashboard functionality |
| Sessions | 4 | Session management |
| Issues | 3 | Issue workflows |
| Orchestrator | 2 | Flow editor |
| CLI | 5 | CLI execution |
| Settings | 3 | Configuration |
| i18n | 2 | Language switching |
| Visual | 2 | UI rendering |

**Key E2E Test Files**:

| File | Purpose |
|------|---------|
| `dashboard.spec.ts` | Dashboard load and interactions |
| `sessions-page.spec.ts` | Session list and filtering |
| `session-detail.spec.ts` | Session detail view |
| `issues-queue.spec.ts` | Issue queue operations |
| `orchestrator.spec.ts` | Visual flow editor |
| `cli-history.spec.ts` | CLI execution history |
| `navigation.spec.ts` | Sidebar navigation |
| `api-error-monitoring.spec.ts` | Error handling |

**Playwright Test Pattern**:

```typescript
// ccw/frontend/tests/e2e/sessions-page.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sessions Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sessions');
    await page.waitForLoadState('networkidle');
  });

  test('should display session list', async ({ page }) => {
    // Wait for sessions to load
    await expect(page.locator('[data-testid="session-list"]')).toBeVisible();
    
    // Check session cards are rendered
    const sessionCards = page.locator('[data-testid="session-card"]');
    await expect(sessionCards.first()).toBeVisible();
  });

  test('should filter sessions by status', async ({ page }) => {
    // Click filter dropdown
    await page.click('[data-testid="status-filter"]');
    
    // Select "completed" option
    await page.click('[data-value="completed"]');
    
    // Verify filtered results
    await page.waitForTimeout(500); // Wait for debounce
    const cards = page.locator('[data-testid="session-card"]');
    const count = await cards.count();
    
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText('Completed');
    }
  });

  test('should navigate to session detail on click', async ({ page }) => {
    // Click first session card
    await page.click('[data-testid="session-card"]:first-child');
    
    // Verify navigation
    await expect(page).toHaveURL(/\/sessions\/[a-z0-9-]+/);
    await expect(page.locator('[data-testid="session-detail"]')).toBeVisible();
  });
});
```

---

## Security Tests

CCW includes dedicated security tests in `ccw/tests/security/`:

| Test File | Focus |
|-----------|-------|
| `command-injection.test.ts` | Shell command safety |
| `path-traversal.test.ts` | File path validation |
| `csrf.test.ts` | CSRF protection |

**Security Test Example**:

```typescript
// ccw/tests/security/path-traversal.test.ts
import { describe, it, expect } from '@jest/globals';
import { sanitizePath } from '../../src/utils/path-sanitizer';

describe('Path Traversal Prevention', () => {
  it('should reject ../ patterns', () => {
    expect(() => sanitizePath('../../../etc/passwd')).toThrow();
  });

  it('should reject absolute paths outside root', () => {
    expect(() => sanitizePath('/etc/passwd')).toThrow();
  });

  it('should allow valid relative paths', () => {
    const result = sanitizePath('src/components/Button.tsx');
    expect(result).toContain('src/components/Button.tsx');
  });
});
```

---

## Visual Regression Tests

Located in `ccw/tests/visual/`:

| Component | Tests | Focus |
|-----------|-------|-------|
| UI Preview | 20 | Component rendering |
| Dashboard | 15 | Layout consistency |
| Theme | 10 | Color scheme variations |

**Snapshot Locations**:
- Baseline: `tests/visual/snapshots/baseline/`
- Compare: `tests/visual/snapshots/compare/`

---

## Test Commands Reference

### Frontend Tests

```bash
# Run all frontend unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- notificationStore.test.ts

# Run E2E tests
npm run e2e

# Run E2E in UI mode
npm run e2e:ui

# Run E2E in debug mode
npm run e2e:debug
```

### Backend Tests

```bash
# Run all backend tests
npm run test:backend

# Run integration tests only
npm run test:integration

# Run security tests
npm run test:security

# Run with coverage
npm run test:backend:coverage
```

### Combined Commands

```bash
# Run all tests (unit + integration + e2e)
npm run test:all

# Run CI test suite
npm run test:ci
```

---

## Testing Best Practices

### 1. Test Isolation

```typescript
// Bad: Shared state between tests
let store;
beforeAll(() => {
  store = createStore();
});

// Good: Fresh state for each test
beforeEach(() => {
  store = createStore();
});
```

### 2. Descriptive Test Names

```typescript
// Bad
it('works', () => {});

// Good
it('should add toast with auto-dismiss after specified duration', () => {});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should remove session from list', () => {
  // Arrange
  const sessions = [{ id: '1', name: 'Test' }];
  const sessionId = '1';

  // Act
  const result = removeSession(sessions, sessionId);

  // Assert
  expect(result).toHaveLength(0);
});
```

### 4. Use Test Data Builders

```typescript
// Bad: Inline test data
const session = {
  id: '123',
  name: 'Test Session',
  status: 'active',
  createdAt: '2025-02-18T00:00:00Z',
  // ... many more fields
};

// Good: Builder pattern
const session = createTestSession({
  status: 'active',
});
```

### 5. Avoid Implementation Details

```typescript
// Bad: Testing internal state
expect(component.instance().state.count).toBe(5);

// Good: Testing observable behavior
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

---

## CI/CD Integration

### GitHub Actions Workflows

| Workflow | Trigger | Tests |
|----------|---------|-------|
| `visual-tests.yml` | PR | Visual regression |
| `coverage.yml` | Push | Coverage report |
| `docs-quality.yml` | PR | Documentation lint |

### Coverage Thresholds

```yaml
# jest.config.js coverage thresholds
coverageThreshold: {
  "global": {
    "branches": 70,
    "functions": 75,
    "lines": 80,
    "statements": 80
  }
}
```

---

## Test Data Management

### Fixtures

Located in `ccw/frontend/tests/fixtures/`:

| Fixture | Purpose |
|---------|---------|
| `sessions.json` | Mock session data |
| `workflows.json` | Mock workflow data |
| `cli-executions.json` | Mock CLI output |

### Mocks

```typescript
// Mock WebSocket for E2E tests
class MockWebSocket {
  send(data: string) {}
  close() {}
  addEventListener(event: string, handler: Function) {}
}
```

---

## Summary

CCW's testing strategy follows industry best practices with a clear pyramid structure. The ~110 unit tests provide fast feedback, ~30 integration tests verify component interactions, and ~45 E2E tests ensure critical user journeys work correctly. Security and visual tests add additional coverage for specialized concerns.

### Test Quality Checklist

- [ ] Tests are isolated and independent
- [ ] Test names describe expected behavior
- [ ] Coverage meets threshold requirements
- [ ] E2E tests cover critical user paths
- [ ] Security tests address OWASP concerns
- [ ] Visual tests prevent UI regressions

---

**Previous**: [Chapter 17: Dashboard Architecture](./ch17-dashboard-architecture.md)
**Up**: [Part VIII/IX Index](./README.md)
