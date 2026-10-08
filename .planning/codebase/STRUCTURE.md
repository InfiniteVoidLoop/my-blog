---
last_mapped_commit: dcf0af2852506e18cb6a14b39f5a914c48add181
last_mapped_at: 2026-10-08
---
# Codebase Structure

**Analysis Date:** 2026-10-08

## Directory Layout

```
my-blog/
├── .planning/                  # Project planning, tracking, and codebase map
│   └── codebase/               # Codebase architecture and analysis documents
├── public/                     # Static assets served as-is at root
│   ├── favicon.svg             # Site favicon
│   └── pagefind/               # Pagefind search assets (copied post-build)
├── src/                        # Main application source code
│   ├── assets/                 # Icons, brand assets, and article images
│   │   ├── icons/              # SVG icons (calendar, RSS, search, socials, etc.)
│   │   └── images/             # Article and theme images
│   ├── components/             # Reusable Astro UI components
│   ├── content/                # Content collections
│   │   ├── pages/              # Static markdown pages (about.md, profile.md)
│   │   └── posts/              # Blog posts (markdown and MDX files)
│   ├── i18n/                   # Internationalization helpers and dictionaries
│   ├── layouts/                # Page layouts (Layout.astro, PostLayout.astro)
│   ├── pages/                  # File-based routing endpoints and pages
│   ├── scripts/                # Client-side runtime scripts (theme.ts)
│   ├── styles/                 # Global styles and Tailwind v4 CSS configuration
│   ├── types/                  # TypeScript interface definitions
│   ├── utils/                  # Utility functions (date formatting, sorting, filters)
│   ├── config.ts               # Resolved runtime configuration module
│   └── content.config.ts       # Astro Content Layer collection definitions
├── astro.config.ts             # Astro engine and Vite configuration
├── astro-paper.config.ts       # User-level site customization settings
├── eslint.config.js            # Flat ESLint configuration
├── package.json                # Dependencies and build scripts
└── tsconfig.json               # TypeScript compiler configuration
```

## Directory Purposes

**`src/components/`:**

- Purpose: Self-contained UI components used across layouts and pages
- Contains: Astro component files (`.astro`)
- Key files: `Header.astro`, `Footer.astro`, `Card.astro`, `Comments.astro`, `Pagination.astro`, `SeriesNav.astro`

**`src/content/posts/`:**

- Purpose: Markdown/MDX articles for the blog
- Contains: `.md`, `.mdx` files with frontmatter metadata and markdown content
- Key files: `src/content/posts/*.mdx`

**`src/pages/`:**

- Purpose: Route handlers matching site URLs
- Contains: Astro templates (`.astro`) and API endpoints (`.ts`)
- Key files: `src/pages/index.astro`, `src/pages/posts/[...slug]/index.astro`, `src/pages/search.astro`, `src/pages/rss.xml.ts`, `src/pages/og.png.ts`

**`src/layouts/`:**

- Purpose: Shared page scaffolding and HTML structure
- Contains: Base layout and article-specific layout
- Key files: `src/layouts/Layout.astro`, `src/layouts/PostLayout.astro`

**`src/utils/`:**

- Purpose: Shared helper utilities for post manipulation, sorting, filtering, and slug generation
- Contains: TypeScript/JavaScript functions
- Key files: `src/utils/getSortedPosts.ts`, `src/utils/postFilter.ts`, `src/utils/slugify.ts`, `src/utils/resolveDefaultOgImagePath.ts`

**`src/styles/`:**

- Purpose: Global stylesheet, Tailwind theme variables, typography styling
- Contains: CSS files
- Key files: `src/styles/global.css`, `src/styles/theme.css`, `src/styles/typography.css`

## Key File Locations

**Entry Points:**

- `src/pages/index.astro`: Home page rendering hero section and post listings
- `src/pages/posts/[...slug]/index.astro`: Article rendering page with interactive scripts
- `src/pages/rss.xml.ts`: RSS feed generation endpoint

**Configuration:**

- `astro-paper.config.ts`: User site title, description, social links, and feature toggles
- `astro.config.ts`: Astro plugins, Markdown extensions, Shiki syntax highlighter configuration
- `src/content.config.ts`: Content collection schemas and loader definitions

**Core Logic:**

- `src/utils/postFilter.ts`: Filters draft posts and scheduled posts
- `src/utils/getSortedPosts.ts`: Sorts posts chronologically by publication datetime
- `src/scripts/theme.ts`: Manages light/dark theme toggles and persistence

**Testing:**

- Not configured

## Naming Conventions

**Files:**

- Astro Components: PascalCase (`Card.astro`, `PostLayout.astro`)
- Utility modules: camelCase (`getSortedPosts.ts`, `slugify.ts`)
- Content files: kebab-case (`web-push-notification.mdx`, `about.md`)
- Page routes: kebab-case / bracket dynamic routes (`[...slug]/index.astro`, `[tag]/index.astro`)

**Directories:**

- Content subdirectories: kebab-case (`posts/database/`, `assets/images/profile/`)
- Page routes: kebab-case (`posts/`, `tags/`, `series/`, `archives/`)

## Where to Add New Code

**New Feature (e.g. Reading Time / Table of Contents / Newsletter):**

- Primary component: `src/components/[FeatureName].astro`
- Utilities / Data transform: `src/utils/[featureUtil].ts`
- Styles: `src/styles/global.css` or scoped `<style>` in component

**New Blog Post:**

- Location: `src/content/posts/[slug].mdx` or `src/content/posts/[category]/[slug].mdx`
- Schema requires: `title`, `description`, `pubDatetime`, `tags`

**New Static Page:**

- Content-driven page: `src/content/pages/[page-name].md` + route in `src/pages/[page-name].astro`

**Utilities:**

- Shared helper functions: `src/utils/[helperName].ts`

## Special Directories

**`dist/`:**

- Purpose: Production build output containing static HTML, CSS, JS, and images
- Generated: Yes
- Committed: No (Ignored via `.gitignore`)

**`.astro/`:**

- Purpose: Astro compiler cache and generated TypeScript type definitions
- Generated: Yes
- Committed: No (Ignored via `.gitignore`)

**`public/pagefind/`:**

- Purpose: Build-time generated static search index copied from `dist/pagefind/`
- Generated: Yes
- Committed: No (Excluded in `tsconfig.json` and `.gitignore`)

---

*Structure analysis: 2026-10-08*
