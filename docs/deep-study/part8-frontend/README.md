# Part VIII/IX: Frontend System and Testing

> **Deep Study Module**: Frontend Architecture and Quality Assurance
> **Version**: 1.0
> **Last Updated**: 2025-02-18

---

## Overview

This module covers the React-based Dashboard frontend and the comprehensive testing strategy employed by CCW. The frontend system manages user interactions, real-time updates, and visualization of workflow data.

---

## Chapters

### Chapter 17: React Dashboard Architecture

**File**: [ch17-dashboard-architecture.md](./ch17-dashboard-architecture.md)

**Topics Covered**:
- 68 page component classification
- Zustand state management strategy
- HTTP vs WebSocket communication protocols
- Component hierarchy and organization
- Performance optimizations

**Key Insights**:
| Metric | Value |
|--------|-------|
| Total Pages | 68 |
| State Stores | 15 (Zustand) |
| Route Modules | 36 |
| WebSocket Events | 20+ |

---

### Chapter 18: Testing Strategy

**File**: [ch18-testing-strategy.md](./ch18-testing-strategy.md)

**Topics Covered**:
- Testing pyramid analysis (~110 unit, ~30 integration, ~45 E2E)
- Framework selection (Vitest, Jest, Playwright)
- Security and visual regression testing
- Test commands reference
- CI/CD integration

**Key Insights**:
| Layer | Count | Framework |
|-------|-------|-----------|
| Unit Tests | ~110 | Vitest / Jest |
| Integration Tests | ~30 | Jest |
| E2E Tests | ~45 | Playwright |
| Security Tests | 4 | Custom |

---

## Key Assets Reference

### Frontend Source Code

| Directory | Contents | Count |
|-----------|----------|-------|
| `ccw/frontend/src/pages/` | Page components | 68 |
| `ccw/frontend/src/stores/` | Zustand stores | 15 |
| `ccw/frontend/src/components/` | Reusable components | 100+ |
| `ccw/frontend/src/lib/` | Utilities and helpers | ~20 |

### Backend Routes

| Directory | Contents | Count |
|-----------|----------|-------|
| `ccw/src/core/routes/` | API route modules | 36 |
| `ccw/src/core/services/` | Core services | 10 |

### Test Files

| Directory | Contents | Count |
|-----------|----------|-------|
| `ccw/tests/` | Backend tests | 105 |
| `ccw/frontend/tests/e2e/` | E2E tests | 43 |
| `ccw/frontend/src/**/*.test.ts(x)` | Frontend unit tests | 26 |

---

## Communication Protocol Summary

| Protocol | Use Case | Implementation |
|----------|----------|----------------|
| HTTP REST | CRUD operations | Express routes |
| WebSocket | Real-time updates | Native WebSocket |
| A2UI Protocol | Agent-to-UI communication | Custom protocol |

---

## Quick Navigation

- **Main Outline**: [../OUTLINE.md](../OUTLINE.md)
- **Previous Part**: [../part7-storage](../part7-storage) (if exists)
- **Next Part**: [../part10-extension](../part10-extension) (if exists)

---

## Related Documentation

### Internal Documentation

- A2UI Protocol Guide: `ccw/docs/a2ui-protocol-guide.md`
- Testing Guidelines: `ccw/docs/testing-guidelines.md`
- Contributing Guide: `ccw/docs/contributing.md`

### External References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [ReactFlow Documentation](https://reactflow.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-18 | Initial documentation |

---

*Generated for CCW Architecture Deep Study*
