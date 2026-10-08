---
last_mapped_commit: dcf0af2852506e18cb6a14b39f5a914c48add181
last_mapped_at: 2026-10-08
---
# Technology Stack

**Analysis Date:** 2026-10-08

## Languages

**Primary:**

- TypeScript 6.0.3 - Type definitions, utility functions, config files, content schemas (`src/**/*.ts`, `astro.config.ts`, `astro-paper.config.ts`)
- Astro Component Syntax - Static templating, component layout, and page routing (`src/**/*.astro`)

**Secondary:**

- JavaScript (ES Modules) - Custom Shiki transformers (`src/utils/transformers/fileName.js`)
- CSS (Tailwind v4) - Global styling, theme tokens, typography overrides (`src/styles/*.css`)
- Markdown / MDX - Content collection entries and articles (`src/content/**/*.md`, `src/content/**/*.mdx`)

## Runtime

**Environment:**

- Node.js >=22.12.0

**Package Manager:**

- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**

- Astro 7.0.3 - Modern Static Site Generator (SSG) with Islands Architecture
- `@astrojs/mdx` 7.0.0 - MDX component and content processing
- `@astrojs/rss` 4.0.18 - RSS feed generation for blog posts
- `@astrojs/sitemap` 3.7.3 - XML sitemap generation

**Testing:**

- Not detected (No unit or E2E testing framework installed; build-time validation via `@astrojs/check` 0.9.9)

**Build/Dev:**

- Vite (embedded in Astro) with `@tailwindcss/vite` 4.3.2
- Pagefind 1.5.2 (`@pagefind/default-ui` 1.5.2) - Static search indexer post-build
- ESLint 10.6.0 with `eslint-plugin-astro` 2.1.1 and `@typescript-eslint/parser` 8.62.0
- Prettier 3.9.3 with `prettier-plugin-astro` 0.14.1 and `prettier-plugin-tailwindcss` 0.8.0
- TypeScript 6.0.3 with `astro/tsconfigs/strict`

## Key Dependencies

**Critical:**

- `astro` 7.0.3 - Primary web framework and content engine
- `tailwindcss` 4.3.2 & `@tailwindcss/vite` 4.3.2 - CSS styling framework
- `satori` 0.26.0 & `sharp` 0.35.2 - Dynamic Open Graph PNG image generation
- `pagefind` 1.5.2 - Static client-side search engine

**Infrastructure:**

- `dayjs` 1.11.21 - Datetime formatting and timezone handling
- `slugify` 1.6.9 & `lodash.kebabcase` 4.1.1 - URL slug and post identifier formatting
- `katex` 0.19.0, `remark-math` 6.0.0, `rehype-katex` 7.0.1 - Math/LaTeX rendering
- `rehype-callouts` 2.2.0 - Obsidian-style callout block support in markdown
- `remark-toc` 9.0.0 & `remark-collapse` 0.1.2 - Collapsible table of contents
- `mermaid` 11.16.1 - Markdown diagram rendering
- `@shikijs/transformers` 4.3.0 - Syntax highlighting notations (diff, highlight, word highlight)

## Configuration

**Environment:**

- Configured via `astro.config.ts` using Astro's type-safe `env.schema`
- `PUBLIC_GOOGLE_SITE_VERIFICATION` (client-accessible public env field, optional)

**Build:**

- `astro.config.ts` - Main Astro configuration (integrations, markdown plugins, fonts, Shiki themes)
- `astro-paper.config.ts` - User-level site configuration (site metadata, post pagination, features, socials, share links)
- `tsconfig.json` - Strict TypeScript configuration extending `astro/tsconfigs/strict` with path aliases (`@/*`)
- `eslint.config.js` - Flat ESLint configuration with Astro plugin rules

## Platform Requirements

**Development:**

- Node.js >= 22.12.0
- npm / npx

**Production:**

- Static web hosting (Cloudflare Pages, Vercel, Netlify, GitHub Pages)
- Current deployment target configured as Cloudflare Pages (`https://astro-paper.pages.dev/`)

---

*Stack analysis: 2026-10-08*
