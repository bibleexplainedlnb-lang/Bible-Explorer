# Threat Model

## Project Overview

Bible Explorer is a Next.js 14 App Router application that serves public Bible-study content and exposes an in-browser admin CMS for creating and managing SEO articles. Production data lives primarily in Supabase (`topics`, `articles`, related content tables), while some legacy route handlers still use Prisma/PostgreSQL models. The application also calls OpenRouter with a server-held API key to generate article ideas, previews, and admin content.

Production scope for this scan is the root Next.js application under `app/`, `lib/`, `middleware.js`, and `prisma/`. `artifacts/`, `attached_assets/`, and other mockup/reference directories are out of scope unless they are invoked by production code. Assume `NODE_ENV=production` when evaluating production behavior.

## Assets

- **Published and draft article content** — article titles, slugs, metadata, and HTML bodies stored in Supabase. Unauthorized modification affects site integrity, SEO, and visitor trust.
- **Topic taxonomy and editorial state** — topic records, category mappings, and workflow metadata such as pillar status and article creation flags. Unauthorized changes can misroute content and corrupt site structure.
- **Server-held secrets and paid API access** — `SUPABASE_SERVICE_ROLE_KEY`, database credentials, and `OPENROUTER_API_KEY`. Abuse of these secrets can bypass data protections or generate direct billing impact.
- **Visitor browser trust** — public pages render article HTML and Bible-study content to unauthenticated users. Any script execution in those pages can steal data, deface content, or pivot into session compromise if auth is added later.
- **Operational availability and spend** — AI generation routes perform remote model calls and can create or mutate content. Unbounded use can exhaust credits or degrade service responsiveness.

## Trust Boundaries

- **Browser to Next.js route handlers** — every `app/api/*` endpoint receives attacker-controlled input and must authenticate, authorize, validate, and bound requests.
- **Public pages to stored HTML content** — Supabase article content crosses from storage into server-rendered pages through `dangerouslySetInnerHTML`; stored content cannot be trusted by default.
- **Next.js server to Supabase** — `lib/supabaseAdmin.js` can operate with elevated privileges and bypass Row Level Security when the service-role key is configured.
- **Next.js server to OpenRouter** — server routes spend application-owned credits through outbound API requests; callers must not be able to abuse that spend boundary.
- **Public to admin boundary** — `/admin` UI and `app/api/admin/*` operations must be protected server-side; hiding links or using `robots: noindex` is not a security control.
- **Production to dev/reference content** — legacy Prisma routes and reference directories exist in the repo; only production-routable code should drive findings.

## Scan Anchors

- **Production entry points:** `app/`, `app/api/`, `middleware.js`, `lib/articlePage.js`, `lib/supabaseAdmin.js`, `lib/generator.js`
- **Highest-risk areas:** `app/api/admin/*`, public OpenRouter routes (`app/api/generate-ideas/route.js`, `app/api/generate-question/route.js`), raw HTML rendering in `lib/articlePage.js`
- **Public/authenticated/admin surfaces:** public content routes are openly reachable; admin CMS is under `/admin`; no built-in authenticated surface was identified during recon and therefore all admin protections must be verified explicitly in code
- **Usually ignore unless proven reachable:** `artifacts/`, `attached_assets/`, legacy reference files not imported by root Next.js app

## Threat Categories

### Spoofing

This project currently has a meaningful public/admin boundary: the browser-facing CMS at `/admin` and its paired API routes perform privileged editorial actions. The application must require a valid server-verified administrator identity before serving the admin UI or accepting any `app/api/admin/*` request. Any future webhook or external callback paths must likewise verify source authenticity before trusting requests.

### Tampering

Attackers can tamper with site content, topic structure, and SEO metadata anywhere user input reaches Supabase or Prisma-backed route handlers. All write-capable APIs must validate payload structure, reject unexpected fields, and enforce authorization before creating, updating, or deleting records. Content generation outputs from AI services must be treated as untrusted input and normalized before persistence.

### Information Disclosure

The application stores draft content, topic metadata, and potentially privileged diagnostics in backend-accessible tables. API responses and logs must not expose more database state than a caller is entitled to see, and privileged routes must not leak operational or unpublished editorial data to anonymous users. Secrets such as the Supabase service-role key and OpenRouter key must never appear in client bundles, logs, or error payloads.

### Denial of Service

OpenRouter-backed endpoints and content-management routes can consume third-party credits, network bandwidth, and database capacity. Publicly reachable generation routes must be rate-limited, request-bounded, and preferably authenticated; otherwise attackers can exhaust spend or tie up server resources with repeated AI calls. Remote requests should also have reasonable failure handling so upstream latency does not cascade into service degradation.

### Elevation of Privilege

The most important guarantee in this codebase is that anonymous visitors must never be able to invoke admin-only functionality or operate through a Supabase client that bypasses RLS. All privileged database mutations must be gated by server-side authorization checks, not by obscurity or frontend-only assumptions. Stored HTML rendered to visitors must also be sanitized or strictly allowlisted so content authors or compromised write paths cannot escalate into script execution in other users’ browsers.
