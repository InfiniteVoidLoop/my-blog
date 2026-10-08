---
last_mapped_commit: dcf0af2852506e18cb6a14b39f5a914c48add181
last_mapped_at: 2026-10-08
---
# External Integrations

**Analysis Date:** 2026-10-08

## APIs & External Services

**Comments & Discussions:**

- Giscus - GitHub Discussions-powered commenting system
  - Implementation: Embedded in `src/components/Comments.astro`
  - Target Repository: `InfiniteVoidLoop/my-blog` (Repo ID: `R_kgDOTaBIoQ`)
  - Category: `Announcements` (Category ID: `DIC_kwDOTaBIoc4DFY-t`)
  - Configuration: Configurable via `src/astro-paper.config.ts`

**Search Services:**

- Pagefind - Built-in static search indexer and client UI
  - SDK/Client: `@pagefind/default-ui` 1.5.2 & `pagefind` 1.5.2 CLI
  - Implementation: `src/pages/search.astro` loads Pagefind bundle from `/pagefind/pagefind.js` and `/pagefind/pagefind-ui.css`
  - Build Pipeline: Generated during `npm run build` (`pagefind --site dist && cp -r dist/pagefind public/`)

**CDN & External Assets:**

- jsDelivr CDN:
  - KaTeX CSS: `https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css` loaded in `src/layouts/Layout.astro`
  - Mermaid ESM: `https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs` dynamically imported in `src/pages/posts/[...slug]/index.astro`
- Google Fonts:
  - Google Sans Code: Provided via Astro Fonts API (`fontProviders.google()` in `astro.config.ts`)

## Data Storage

**Databases:**

- None (File-based Markdown/MDX content collections using Astro Content Layer in `src/content.config.ts`)

**File Storage:**

- Local filesystem only (`src/assets/images/`, `public/`)

**Caching:**

- None (Static asset caching managed by edge hosting provider / CDN)

## Authentication & Identity

**Auth Provider:**

- None (Public static website / blog)

## Monitoring & Observability

**Error Tracking:**

- None configured

**Logs:**

- Build-time Astro and Pagefind stdout/stderr console logs

## CI/CD & Deployment

**Hosting:**

- Cloudflare Pages / Static Hosting target (configured URL: `https://astro-paper.pages.dev/`)

**CI Pipeline:**

- Build command: `npm run build` (`astro check && astro build && pagefind --site dist && cp -r dist/pagefind public/`)

## Environment Configuration

**Required env vars:**

- `PUBLIC_GOOGLE_SITE_VERIFICATION` - Optional Google site verification token for SEO (`astro:env/client`)

**Secrets location:**

- No sensitive secrets or private API keys required for runtime

## Webhooks & Callbacks

**Incoming:**

- None

**Outgoing:**

- None (Static generation only)

---

*Integration audit: 2026-10-08*
