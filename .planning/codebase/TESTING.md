---
last_mapped_commit: dcf0af2852506e18cb6a14b39f5a914c48add181
last_mapped_at: 2026-10-08
---
# Testing Patterns

**Analysis Date:** 2026-10-08

## Test Framework

**Runner:**

- No automated test runner (e.g. Vitest, Jest, Playwright) is currently installed in `package.json`.

**Type Checking & Validation Tools:**

- Astro Check: `@astrojs/check` 0.9.9
- TypeScript: `typescript` 6.0.3 with strict compiler checks
- ESLint: `eslint` 10.6.0 with `eslint-plugin-astro`

**Run Commands:**

```bash
npm run build          # Typecheck (astro check), build SSG pages, and index search (pagefind)
npm run lint           # Run ESLint across all .astro and .ts files
npm run format:check   # Validate code formatting with Prettier
```

## Test File Organization

**Location:**

- Not applicable (No test suites currently present in `src/`)

**Naming:**

- Recommended standard for future tests: `*.test.ts` or `*.spec.ts` co-located in `src/utils/` or `tests/`

**Structure:**

- Recommended structure for adding tests:

```
tests/
├── unit/
│   ├── postFilter.test.ts
│   └── slugify.test.ts
└── e2e/
    └── navigation.spec.ts
```

## Test Structure

**Suite Organization:**

```typescript
// Recommended pattern for future unit tests (e.g. using Vitest)
import { describe, it, expect } from "vitest";
import { postFilter } from "@/utils/postFilter";

describe("postFilter", () => {
  it("filters out draft posts", () => {
    const mockPost = { data: { draft: true, pubDatetime: new Date() } };
    expect(postFilter(mockPost as any)).toBe(false);
  });
});
```

**Patterns:**

- Pure function testing for utilities (`src/utils/*.ts`)
- Content schema validation tests for frontmatter fixtures

## Mocking

**Framework:**

- None configured

**What to Mock:**

- External network requests (e.g. Giscus if testing UI components)
- Satori font loading and image generation buffers

**What NOT to Mock:**

- Pure date calculations and string manipulation utilities

## Fixtures and Factories

**Test Data:**

- Markdown files in `src/content/posts/` serve as real fixtures for build validation.

**Location:**

- `src/content/posts/`

## Coverage

**Requirements:** None enforced

**View Coverage:**

- Not configured

## Test Types

**Unit Tests:**

- None configured

**Integration Tests:**

- Build-time collection validation: `astro check` verifies all frontmatter matches the Zod schemas in `src/content.config.ts`.

**E2E Tests:**

- None configured

## Common Patterns

**Async Testing:**

- Not configured

**Error Testing:**

- Verify build fails gracefully when invalid frontmatter is provided to `src/content/posts/`.

---

*Testing analysis: 2026-10-08*
