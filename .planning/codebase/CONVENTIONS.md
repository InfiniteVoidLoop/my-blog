---
last_mapped_commit: dcf0af2852506e18cb6a14b39f5a914c48add181
last_mapped_at: 2026-10-08
---
# Coding Conventions

**Analysis Date:** 2026-10-08

## Naming Patterns

**Files:**

- Astro Components: PascalCase (e.g., `src/components/Comments.astro`, `src/layouts/Layout.astro`)
- TypeScript / Utility Files: camelCase (e.g., `src/utils/getSortedPosts.ts`, `src/utils/postFilter.ts`)
- Content Markdown / MDX: kebab-case (e.g., `src/content/posts/firebase-cloud-message.mdx`)
- CSS stylesheets: kebab-case (e.g., `src/styles/global.css`, `src/styles/theme.css`)

**Functions:**

- camelCase (e.g., `getSortedPosts`, `slugify`, `postFilter`, `toTransitionName`)
- Hook / helper functions: `useTranslations`, `defineAstroPaperConfig`

**Variables:**

- camelCase for standard variables and properties (`sortedPosts`, `featuredPosts`, `pubDatetime`)
- UPPER_SNAKE_CASE for global constants (e.g., `BLOG_PATH`, `DEFAULT_OG_IMAGE`, `PUBLIC_GOOGLE_SITE_VERIFICATION`)

**Types & Interfaces:**

- PascalCase (e.g., `ResolvedAstroPaperConfig`, `AstroPaperConfig`, `Props`)

## Code Style

**Formatting:**

- Prettier 3.9.3 with plugins:
  - `prettier-plugin-astro`
  - `prettier-plugin-tailwindcss`
- Commands: `npm run format:check` and `npm run format`

**Linting:**

- ESLint 10.6.0 with `eslint-plugin-astro` and `@typescript-eslint/parser`
- Rules enforced: `"no-console": "error"` (except build-time scripts or ignored directories)
- Ignored paths: `dist/**`, `.astro/**`, `public/pagefind/**`

## Import Organization

**Order:**

1. External package imports (e.g., `import { getCollection } from "astro:content";`, `import dayjs from "dayjs";`)
2. Path aliased project imports (e.g., `import Layout from "@/layouts/Layout.astro";`, `import config from "@/config";`)
3. Relative local imports (e.g., `import type { ResolvedAstroPaperConfig } from "./types/config";`)
4. Stylesheet imports (e.g., `import "@/styles/global.css";`)

**Path Aliases:**

- Defined in `tsconfig.json`:
  - `@/*` -> `./src/*`
  - `@/astro-paper.config` -> `./astro-paper.config`

## Error Handling

**Patterns:**

- Build-time validation: Zod schemas validate frontmatter on content collections, throwing immediate compiler errors during `astro check` / `astro build`
- Client-side error protection: Safe optional chaining (`?.`) and fallback nullish coalescing operators (`??`) across data access
- 404 Route handling: Dedicated fallback layout in `src/pages/404.astro`

## Logging

**Framework:** None in client runtime; `eslint` rule `"no-console": "error"` restricts `console.log` in application source files.

**Patterns:**

- Build scripts and CLI integration use standard Node stdout/stderr.

## Comments

**When to Comment:**

- Header docstrings explaining architectural purpose (e.g., `src/config.ts`)
- Client script lifecycle logic (e.g., view transitions handling and touch gesture mathematics in `src/pages/posts/[...slug]/index.astro`)

**JSDoc/TSDoc:**

- Used on public utility interfaces and configuration helpers (`defineAstroPaperConfig`).

## Function Design

**Size:**

- Single responsibility, pure functions where possible (e.g., `src/utils/postFilter.ts`, `src/utils/getSortedPosts.ts`).

**Parameters:**

- Named option objects or typed Props interfaces for Astro components (`type Props = { title?: string; ... }`).

**Return Values:**

- Explicit return types or inferred pure transformations.

## Module Design

**Exports:**

- Named exports for utilities (`export const getSortedPosts = ...`)
- Default export for top-level configurations and Astro page components

**Barrel Files:**

- Used in `src/i18n/index.ts` to export translation helpers and language bindings.

---

*Convention analysis: 2026-10-08*
