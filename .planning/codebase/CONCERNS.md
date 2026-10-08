---
last_mapped_commit: dcf0af2852506e18cb6a14b39f5a914c48add181
last_mapped_at: 2026-10-08
---
# Codebase Concerns

**Analysis Date:** 2026-10-08

## Tech Debt

**Hardcoded Author & Theme Defaults:**

- Issue: Profile links, author placeholder URLs, and sample edit links from the original theme template remain in configuration and pages.
- Files: `astro-paper.config.ts`, `src/pages/index.astro:58`, `src/content/pages/profile.md:9`
- Impact: Inconsistent author information, placeholder TODO comments in markup.
- Fix approach: Update `astro-paper.config.ts` with accurate author details and replace TODO placeholders in `index.astro` and `profile.md`.

**Runtime CDN Script Dependencies:**

- Issue: KaTeX CSS and Mermaid rendering scripts are loaded directly from external CDN (`cdn.jsdelivr.net`) at runtime rather than bundled locally.
- Files: `src/layouts/Layout.astro:48`, `src/pages/posts/[...slug]/index.astro:323`
- Impact: If the CDN is unreachable or offline, math formulas and mermaid diagrams will fail to render; external network request latency.
- Fix approach: Bundle Mermaid and KaTeX locally via Vite or pre-render diagrams at build time during markdown compilation.

## Known Bugs

**None identified:**

- The build (`astro check && astro build`) passes cleanly without syntax or typing errors.

## Security Considerations

**External CDN Injection:**

- Risk: Loading runtime JavaScript from external CDNs without Subresource Integrity (SRI) hashes (`https://cdn.jsdelivr.net/npm/mermaid@11/...`).
- Files: `src/pages/posts/[...slug]/index.astro:323`
- Current mitigation: Mermaid is loaded over HTTPS.
- Recommendations: Bundle `mermaid` locally (already in `package.json` dependencies) instead of dynamic import from external CDN URL.

**Giscus Configuration:**

- Risk: Giscus script requires repository and category IDs which are public.
- Files: `astro-paper.config.ts`
- Current mitigation: Giscus uses GitHub OAuth token on client-side; no server secret is exposed.
- Recommendations: Ensure repository discussion permissions match intended moderation rules.

## Performance Bottlenecks

**Dynamic OG Image Generation:**

- Problem: Satori + Sharp generate PNG images for all posts and pages during static build.
- Files: `src/pages/og.png.ts`, `src/pages/posts/[...slug]/index.png.ts`
- Cause: Canvas SVG rendering and image encoding is CPU-intensive.
- Improvement path: Ensure images are cached across incremental builds if post volume increases significantly.

## Fragile Areas

**Client-Side Script DOM Binding with View Transitions:**

- Files: `src/pages/posts/[...slug]/index.astro` (Lightbox and Mermaid scripts), `src/scripts/theme.ts`
- Why fragile: Client scripts must properly tear down and re-bind event listeners across Astro view transition lifecycle events (`astro:page-load`, `astro:after-swap`, `astro:before-swap`). Missing event handlers will cause interactive elements (image zoom, theme toggle, diagrams) to become unresponsive after navigating between pages.
- Safe modification: Always test client interactivity across multi-page navigation transitions.
- Test coverage: Currently manual testing only.

## Scaling Limits

**Build-Time Search Indexing:**

- Current capacity: Fast for current post count (<50 posts).
- Limit: Pagefind creates a static index; extremely large blogs (10,000+ posts) may see increased build and bundle times.
- Scaling path: Pagefind scales up to hundreds of thousands of pages efficiently, but build step memory should be monitored.

## Dependencies at Risk

**Bleeding-Edge Dependency Versions:**

- Risk: Using Astro 7.0, Tailwind v4.3, ESLint 10, TypeScript 6.
- Impact: Minor breaking changes in experimental features or plugins (e.g. `svgoOptimizer` experimental flag in `astro.config.ts`).
- Migration plan: Keep dependencies updated with lockfile and monitor Astro release notes.

## Missing Critical Features

**Automated Test Suite:**

- Problem: No automated unit testing or integration testing suite (e.g., Vitest).
- Blocks: Automated regression testing for utility functions (`getSortedPosts`, `postFilter`, `slugify`) and component rendering.

## Test Coverage Gaps

**Utility Functions & Content Loaders:**

- What's not tested: Post filtering edge cases (future scheduled posts margin, drafts, pagination slicing).
- Files: `src/utils/postFilter.ts`, `src/utils/getSortedPosts.ts`, `src/utils/slugify.ts`
- Risk: Regressions in post visibility or pagination ordering during updates.

---

*Concerns analysis: 2026-10-08*
