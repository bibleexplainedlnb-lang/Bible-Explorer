# Faith & Scripture

A Bible study and faith Q&A platform built with Next.js, Tailwind CSS, and SQLite.

Browse questions about faith, explore theological topics, read study guides, and navigate the full King James Bible — all from a fast, content-first web app.

---

## Features

- **Questions** — Searchable faith questions with full biblical explanations
- **Topics** — Browse questions grouped by theological topic (Salvation, Jesus, Prayer, etc.)
- **Guides** — Long-form study guides linking related questions and topics
- **Bible reader** — Full KJV Bible at `/bible/[book]/[chapter]/[verse]` with a sidebar navigator
- **Admin** — Create new questions at `/admin` with real-time slug validation
- **AI generation** — Generate structured content (biblical explanation, meaning, application, related verses) from a keyword + topic using OpenAI
- **Internal linking** — Content is automatically enriched at save time with links to Bible references, related questions, and topics
- **Full-text search** — Client-side search across all questions, topics, and guides

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, Server Components, Server Actions) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin) |
| Database | [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Bible data | [kjv](https://www.npmjs.com/package/kjv) npm package (31,102 verses, offline) |
| AI | [OpenAI](https://platform.openai.com/) (gpt-5.2) — optional, for content generation |
| Language | TypeScript |

---

## Project Structure

```
artifacts/nextjs-site/
├── app/
│   ├── page.tsx                    # Homepage — questions, topics, guides
│   ├── layout.tsx                  # Root layout with header
│   ├── Header.tsx                  # Sticky nav with search bar
│   ├── SearchBar.tsx               # Client-side full-text search
│   ├── admin/
│   │   ├── page.tsx                # Admin — add new question
│   │   ├── AdminForm.tsx           # Client form with slug validation
│   │   └── actions.ts              # Server Actions: save + slug check
│   ├── questions/[slug]/page.tsx   # Question detail page
│   ├── topics/[slug]/page.tsx      # Topic page with question list
│   ├── guides/[slug]/page.tsx      # Study guide page
│   └── bible/
│       ├── layout.tsx              # Bible layout with sidebar nav
│       ├── BibleNavSidebar.tsx     # Book / chapter / verse navigator
│       └── [book]/[chapter]/
│           ├── page.tsx            # Chapter reading view
│           └── [verse]/page.tsx    # Single verse page
├── lib/
│   ├── db.ts                       # SQLite CRUD helpers (questions, topics, guides)
│   ├── bible.js                    # KJV verse/chapter lookup (offline)
│   ├── bible-references.tsx        # Bible reference parser and HTML linkifier
│   ├── enrich.ts                   # Save-time internal link enrichment
│   └── generate.ts                 # AI content generation via OpenAI
├── data/
│   ├── content.json                # Seed data (questions, topics, guides)
│   └── content.db                  # SQLite DB — auto-created on first run (gitignored)
├── .env.example                    # Required environment variables
├── next.config.ts
└── package.json
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/faith-and-scripture.git
cd faith-and-scripture
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables (optional)

AI content generation requires an OpenAI API key. Copy the example file and fill it in:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
OPENAI_API_KEY=sk-...
```

> **Skip this step** if you don't need AI generation — the rest of the app works without it.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> The SQLite database is created automatically on first request and seeded from `data/content.json`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run typecheck` | Run TypeScript type checking |

---

## Database

The app uses SQLite with `better-sqlite3`. The database file is auto-created at `data/content.db` and seeded from `data/content.json` on first run.

**Tables:** `questions` · `topics` · `guides` · `bible_notes`

To reset the database, delete `data/content.db` and restart the server.

---

## Routes

| Route | Description |
|---|---|
| `/` | Homepage |
| `/questions/[slug]` | Question detail |
| `/topics/[slug]` | Topic with question list |
| `/guides/[slug]` | Study guide |
| `/bible/[book]/[chapter]` | Chapter reader |
| `/bible/[book]/[chapter]/[verse]` | Single verse |
| `/admin` | Add new question |

---

## Adding Content

### Via the admin page

Visit `/admin` to add a question through the form. The slug is auto-generated from the title and validated for duplicates in real time.

### Via `data/content.json`

Add entries to `data/content.json` and delete `data/content.db` to reseed. The JSON file is the source of truth for initial content.

---

## Deployment

### Vercel (recommended)

```bash
npm run build
```

Deploy the project root to [Vercel](https://vercel.com). Add `OPENAI_API_KEY` to your Vercel environment variables if using AI generation.

### Docker (standalone)

The project is configured for Next.js standalone output (`next.config.ts`), which bundles only the files needed to run:

```bash
npm run build
node .next/standalone/server.js
```

---

## License

MIT
