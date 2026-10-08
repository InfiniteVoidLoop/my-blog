---
last_mapped_commit: dcf0af2852506e18cb6a14b39f5a914c48add181
last_mapped_at: 2026-10-08
---
<!-- refreshed: 2026-10-08 -->

# Architecture

**Analysis Date:** 2026-10-08

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           Astro Page Routes                             │
│       `src/pages/index.astro`          `src/pages/posts/[...slug]/`     │
│       `src/pages/tags/`                `src/pages/archives/`            │
│       `src/pages/search.astro`         `src/pages/og.png.ts`            │
├─────────────────────────────────────────────────────────────────────────┤
│                           Layouts & Components                          │
│       `src/layouts/Layout.astro`       `src/layouts/PostLayout.astro`   │
│       `src/components/Header.astro`    `src/components/Footer.astro`    │
│       `src/components/Card.astro`      `src/components/Comments.astro`  │
├─────────────────────────────────────────────────────────────────────────┤
│                           Content & Logic Layer                         │
│  `src/content.config.ts` (Zod schemas: posts, pages)                    │
│  `src/utils/getSortedPosts.ts`, `src/utils/postFilter.ts`               │
│  `src/astro-paper.config.ts` -> `src/config.ts` (Typed Config)          │
│  `src/i18n/` (Localization helpers & dictionary)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                           Static Data & Output                          │
│  `src/content/posts/*.{md,mdx}`, `src/content/pages/*.md`               │
│  `dist/` (SSG HTML/CSS/JS output + Pagefind static search index)        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `Layout` | Base HTML wrapper, meta tags, font loading, ClientRouter, theme initialization | `src/layouts/Layout.astro` |
| `PostLayout` | Article page wrapper, JSON-LD Schema.org metadata, header/footer container | `src/layouts/PostLayout.astro` |
| `Header` | Site navigation, mobile toggle menu, search/RSS/theme buttons | `src/components/Header.astro` |
| `Footer` | Copyright notice, social links, footer layout | `src/components/Footer.astro` |
| `Card` | Post teaser card with title, date, description, and tags | `src/components/Card.astro` |
| `Comments` | Giscus discussion iframe integration with theme synchronization | `src/components/Comments.astro` |
| `SeriesNav` | Navigation component for multi-part article series | `src/components/SeriesNav.astro` |
| `Pagination` | Previous/Next page navigation links | `src/components/Pagination.astro` |
| `Datetime` | Localized post publication and modification timestamp display | `src/components/Datetime.astro` |

## Pattern Overview

**Overall:** Static Site Generation (SSG) with Islands Architecture, Content Collections, and Astro View Transitions (`ClientRouter`).

**Key Characteristics:**

- Type-safe content layer using Zod schemas with Astro `glob` loaders
- Dual theme support (light/dark) via CSS variables, data attributes, and vanilla JS client scripts
- Pure build-time generation: dynamic OG images generated using Satori + Sharp during build
- Client-side progressive enhancement: Search powered by Pagefind static index, client-side lightbox for image zooming, on-demand Mermaid diagram rendering

## Layers

**Presentation Layer:**

- Purpose: User interface rendering and page routing
- Location: `src/pages/`, `src/components/`, `src/layouts/`
- Contains: `.astro` components, inline client scripts, scoped styles
- Depends on: Content Layer, Utilities, Configuration, i18n
- Used by: Browser clients

**Content Layer:**

- Purpose: Markdown/MDX parsing, schema validation, collection management
- Location: `src/content.config.ts`, `src/content/`
- Contains: Zod schemas, content collections definitions (`posts`, `pages`), markdown/mdx articles
- Depends on: `astro:content`, `astro/zod`, `astro/loaders`
- Used by: Pages and layouts via `getCollection("posts")`

**Configuration & Utilities Layer:**

- Purpose: Centralized typed configuration, URL formatting, date math, OG image generation
- Location: `astro-paper.config.ts`, `src/config.ts`, `src/utils/`, `src/i18n/`
- Contains: Pure utility functions, config resolvers, i18n dictionaries
- Depends on: `dayjs`, `slugify`, `satori`, `sharp`
- Used by: All components and pages

## Data Flow

### Primary Request Path (Blog Post View)

1. User navigates to `/posts/[slug]/` (`src/pages/posts/[...slug]/index.astro:1`)
2. `getStaticPaths()` queries `getCollection("posts")`, filters non-draft/published entries using `postFilter` (`src/utils/postFilter.ts`)
3. Astro renders markdown body using MDX/Remark/Rehype plugins pipeline (`rehype-callouts`, `rehype-katex`, `@shikijs/transformers`)
4. `PostLayout.astro` injects OpenGraph headers, Twitter card metadata, and Schema.org `BlogPosting` JSON-LD (`src/layouts/PostLayout.astro`)
5. Client-side scripts execute: theme sync, interactive lightbox listener (`src/pages/posts/[...slug]/index.astro`), Mermaid diagram rendering

### Dynamic OG Image Generation Flow

1. Build queries `/og.png.ts` or `/posts/[slug]/index.png`
2. Title, author, and description passed into SVG template constructed with `satori`
3. SVG buffer converted to WebP/PNG buffer via `sharp` and returned as static image response

**State Management:**

- Theme state (`light` / `dark`) stored in browser `localStorage` under key `theme` and applied via `data-theme` on `document.documentElement` (`src/scripts/theme.ts`)
- Client navigation state managed by Astro Transitions `ClientRouter`

## Key Abstractions

**Content Schema:**

- Purpose: Type contract for all blog posts and pages
- Examples: `src/content.config.ts`
- Pattern: Zod object schema defining required/optional frontmatter fields (`pubDatetime`, `title`, `tags`, `featured`, `draft`, `series`, `seriesOrder`)

**Resolved Config:**

- Purpose: Provides typed fallback defaults over user configuration
- Examples: `src/config.ts`, `src/types/config.ts`, `astro-paper.config.ts`
- Pattern: Adapter pattern transforming user config to `ResolvedAstroPaperConfig`

## Entry Points

**Main Page:**

- Location: `src/pages/index.astro`
- Triggers: HTTP GET `/`
- Responsibilities: Renders hero introduction, featured blog posts, recent blog posts, and social links

**Post Detail Page:**

- Location: `src/pages/posts/[...slug]/index.astro`
- Triggers: HTTP GET `/posts/:slug`
- Responsibilities: Renders complete post content, series navigation, tags, edit link, comments, and lightbox script

**RSS Feed:**

- Location: `src/pages/rss.xml.ts`
- Triggers: Build-time / HTTP GET `/rss.xml`
- Responsibilities: Generates standard RSS 2.0 XML feed of published posts

## Architectural Constraints

- **Single-threaded SSG:** All pages and collections are pre-rendered at build time.
- **Client-Side Scripts:** Must register event listeners for Astro view transition events (`astro:page-load`, `astro:after-swap`, `astro:before-swap`) rather than only `DOMContentLoaded`.
- **Search Dependency:** Client search requires Pagefind assets generated during build step (`pagefind --site dist`).

## Anti-Patterns

### Using `window.onload` or raw `DOMContentLoaded` for client interactivity

**What happens:** Scripts break when users navigate using Astro's `ClientRouter` SPA transitions.
**Why it's wrong:** New DOM content is swapped without a full page reload.
**Do this instead:** Listen to `astro:page-load` and `astro:after-swap` events (see `src/pages/posts/[...slug]/index.astro`).

### Reading `.env` files directly in client components

**What happens:** Undefined environment variables or build errors.
**Why it's wrong:** Astro uses strict client/server environment boundaries (`astro:env/client`).
**Do this instead:** Import environment variables defined in `astro.config.ts` schema from `astro:env/client`.

## Error Handling

**Strategy:** Build-time validation and fallback 404 static routing.

**Patterns:**

- 404 handler page in `src/pages/404.astro` with localized error messaging and back-to-home button
- Zod frontmatter schema validation throwing descriptive build errors on invalid dates or missing required fields

## Cross-Cutting Concerns

**Logging:** Build-time console logging; `eslint` rule `"no-console": "error"` prevents rogue console logs in source code.
**Validation:** Zod schema validation on content collections.
**Authentication:** None required (fully static public website).

---

*Architecture analysis: 2026-10-08*
