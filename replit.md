# Workspace

## Overview

Bible Explorer — Next.js 14 (App Router, JavaScript) KJV Bible study site, migrated from Vercel to Replit.

**Running:** `npm run dev` on port 3000 (workflow: "Start application")

**Required environment variables:**
- `DATABASE_URL` — PostgreSQL connection string (Prisma/PostgreSQL layer)
- `OPENROUTER_API_KEY` — AI content generation (admin routes)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (admin article management; optional)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (admin article management; optional)
- `NEXT_PUBLIC_SITE_URL` — Public site URL for sitemap/canonical (defaults to Vercel URL if not set)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/nextjs-site` (`@workspace/nextjs-site`)

**SQLite database** (`lib/db.ts`):
- `better-sqlite3` (synchronous, server-only — works with Next.js server components and Route Handlers)
- DB file: `data/content.db` (relative to `artifacts/nextjs-site/`, created automatically on first import)
- WAL mode + foreign keys enabled
- Tables: `questions`, `topics`, `guides`, `bible_notes`
- Exports typed CRUD helpers: `questions.{list,findById,findBySlug,listByTopic,create,update,delete}`, same pattern for `topics`, `guides`, `bibleNotes` (plus `bibleNotes.upsert` and `bibleNotes.findByReference`)
- Singleton pattern via `globalThis.__sqlite_db` to survive HMR reloads in dev

Next.js 15 (App Router) content site styled with Tailwind CSS 4.

- Entry: `app/layout.tsx` — shared header/footer layout with navigation
- Pages: `/` (homepage), `/questions/[slug]`, `/topics/[slug]`, `/guides/[slug]`, `/bible/[book]/[chapter]`
- Styling: Tailwind CSS 4 with `@tailwindcss/postcss`
- Dev server: `next dev --turbo --port $PORT --hostname 0.0.0.0` on port 18425
- `pnpm --filter @workspace/nextjs-site run dev` — run the dev server

**Data architecture:**
- `data/content.json` — single source of truth for questions, topics, and Bible chapter explanations (`bibleExplanations`)
  - `bibleExplanations` stores explanation metadata (overview, context, application) keyed by `book` + `chapter`; no verse data stored here
- `lib/bible.ts` — utility module for live KJV Bible data
  - `fetchChapter(book, chapter)` — fetches a full chapter from `bible-api.com` KJV endpoint; responses cached 24 h via Next.js `fetch` caching
  - `fetchVerse(book, chapter, verse)` — fetches a single verse from the same API
- Bible pages display all KJV verses from the live API; when a `bibleExplanation` entry exists for the chapter, a sticky explanation panel (Overview / Context / Application tabs) is shown alongside the verses
- Any chapter in the entire Bible is accessible at `/bible/[book]/[chapter]` even without an explanation entry — only the verse column renders in that case

### `artifacts/bible-explorer` — Bible Explorer (Bible Verse Insights)

Next.js 14 (App Router, JavaScript) KJV Bible study site. Dev server runs via `npm run dev` in the workspace root.

**Content architecture — STRICT DB-driven (Supabase `articles` table):**
- ALL pages fetch exclusively from the Supabase `articles` table. No SQLite, no Prisma, no static/hardcoded content.
- If a slug is not found in DB → `notFound()` (404). Zero fallbacks. Zero auto-generation.
- Category listing pages check `isCategoryActive()` from `lib/categories.js` before rendering; inactive categories → 404.
- Sitemap: only `SELECT slug FROM articles WHERE status='published'`; no static pages, no category pages, no Bible chapter URLs.
- Interlinking: only links to slugs that exist as published articles in DB. If no article exists for a keyword group, a plain-text placeholder sentence is injected instead (no dead link created).
- Slug redirect: when admin renames a slug, old slug is recorded in `slug_redirects` Supabase table; `/bible-verses/[old-slug]/` permanently redirects to new URL.
  - DB table required: `CREATE TABLE IF NOT EXISTS slug_redirects (old_slug TEXT PRIMARY KEY, new_slug TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());`
- `lib/supabase.js` — shared Supabase client used by every page
- `lib/categories.js` — `ACTIVE_CATEGORIES` set; add/remove categories here to activate/deactivate listing pages
- `lib/db.js` — legacy SQLite file (kept for reference only, not used by any page)
- `lib/prisma.js` — legacy Prisma file (kept for reference only, not used by any page)
- `prisma` + `@prisma/client` pinned at 5.22.0 — do NOT upgrade

**Supabase DB schema:**
- `articles` table: `id`, `slug`, `title`, `content` (HTML), `meta_title`, `meta_description`, `keywords`, `related_slugs`, `topic_id` (FK → topics.id), `status` (published/draft/rejected), `created_at`. **NO `category` column** — category lives only in `topics`.
- `topics` table: `id`, `name`, `category` (questions/guides/topics), `created_at`.
- Category is always read via join: `.select('*, topics(name, category)')` → `article.topics?.category`.
- **NEVER** query or insert `articles.category` — column does not exist.

**Page routing:**
- `/` — homepage; fetches 5 recent guides + 5 recent questions from Supabase
- `/questions/` — lists articles whose `topic_id` matches topics with `category=questions`
- `/guides/` — lists articles whose `topic_id` matches topics with `category=guides`
- `/topics/` — lists articles whose `topic_id` matches topics with `category=topics`
- `/bible-verses/[slug]/` — canonical article page; full article render from Supabase
- `/questions/[slug]/` — 308 redirect to `/bible-verses/[slug]/` if found, else 404
- `/guides/[slug]/` — 308 redirect to `/bible-verses/[slug]/` if found, else 404
- `/topics/[slug]/` — 308 redirect to `/bible-verses/[slug]/` if found, else 404
- `/bible-verse-about-patience/` — 404
- `/[slug]/` (catch-all) — 404

**Key files:**
- `app/layout.js` — metadataBase, global robots index/follow, OpenGraph, nav header + footer
- `app/page.js` — homepage; Supabase fetch, featured Bible passages (hardcoded nav links only)
- `app/sitemap.js` — dynamic sitemap from Supabase articles
- `public/robots.txt` — User-agent: *, Allow: /, Sitemap URL
- `lib/seoEnrich.js` — async AI-powered inline linking pipeline
- `lib/generator.js` — OpenRouter AI generation (MODEL: gpt-4.1-mini)
- `app/bible-verses/[slug]/page.js` — canonical article page with full SEO metadata
- `app/admin/_components/Articles.js` — admin CMS with Upgrade AI, Old Article badge, Save Draft/Publish
- `app/globals.css` — .prose-content CSS class styles all HTML content
- `app/not-found.js` — 404 page
- `next.config.js` — serverExternalPackages for better-sqlite3; trailingSlash: true

**Admin panel** at `/admin/`:
- Lists all Supabase articles (up to 2000), filterable by category/status
- Generate single article or bulk generate from ideas
- AI upgrade preview (does not auto-save)
- Relink all articles via `POST /api/admin/articles/relink`

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
