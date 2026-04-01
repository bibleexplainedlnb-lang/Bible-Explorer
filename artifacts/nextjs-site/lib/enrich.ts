/**
 * Content enrichment — server only.
 *
 * enrichContent(html) applies internal links to a saved HTML string:
 *   1. Bible references  → /bible/[book]/[chapter]/[verse]
 *   2. Question titles   → /questions/[slug]
 *   3. Topic names       → /topics/[slug]
 *
 * All replacements run only on text nodes — never inside existing HTML tags
 * or anchor elements — so double-linking is impossible.
 *
 * Only the FIRST occurrence of each question title / topic name is linked,
 * keeping the content readable without excessive link density.
 */

import {
  REFERENCE_RE,
  buildBibleHref,
  BIBLE_LINK_CLASS,
  processTextNodes,
} from "./bible-references";
import { questions as qdb, topics as tdb } from "./db";

// ─── Link styles ─────────────────────────────────────────────────────────────

const QUESTION_LINK_CLASS =
  "text-blue-700 underline underline-offset-2 decoration-blue-300 font-medium hover:text-blue-900 transition-colors";

const TOPIC_LINK_CLASS =
  "text-violet-700 underline underline-offset-2 decoration-violet-300 font-medium hover:text-violet-900 transition-colors";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Apply a regex replacement to text nodes, with a "seen" set so only
 * the first occurrence of each matched group is linked.
 */
function linkFirstOccurrence(
  html: string,
  items: Array<{ pattern: RegExp; href: string; cls: string }>,
): string {
  const seen = new Set<string>();

  return processTextNodes(html, (text) => {
    let result = text;
    for (const { pattern, href, cls } of items) {
      pattern.lastIndex = 0;
      result = result.replace(pattern, (match) => {
        const key = href; // one link per item regardless of case variation
        if (seen.has(key)) return match;
        seen.add(key);
        return `<a href="${href}" class="${cls}">${match}</a>`;
      });
    }
    return result;
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Enrich an HTML string with internal links.
 * Safe to call on content that contains existing `<a>` tags.
 *
 * @param html - Raw HTML content to enrich
 * @param excludeSlug - Optional question/topic slug to exclude from linking
 *                      (prevents a page from linking to itself)
 */
export function enrichContent(html: string, excludeSlug?: string): string {
  if (!html.trim()) return html;

  // ── 1. Bible references ───────────────────────────────────────────────────
  const bibleRe = new RegExp(REFERENCE_RE.source, "g");
  let result = processTextNodes(html, (text) =>
    text.replace(bibleRe, (match, book, chapter, verse) => {
      const href = buildBibleHref(book, chapter, verse);
      return `<a href="${href}" class="${BIBLE_LINK_CLASS}">${match}</a>`;
    }),
  );

  // ── 2. Question titles ────────────────────────────────────────────────────
  const allQuestions = qdb.list().filter((q) => q.slug !== excludeSlug);
  // Sort longest first to avoid partial matches (e.g. "What is Faith?" before "Faith")
  const sortedQ = [...allQuestions].sort((a, b) => b.title.length - a.title.length);

  const questionItems = sortedQ.map((q) => ({
    pattern: new RegExp(
      `(?<![\\w"'>])${escapeRegex(q.title)}(?![\\w"'<])`,
      "gi",
    ),
    href: `/questions/${q.slug}`,
    cls: QUESTION_LINK_CLASS,
  }));

  result = linkFirstOccurrence(result, questionItems);

  // ── 3. Topic names ────────────────────────────────────────────────────────
  const allTopics = tdb.list().filter((t) => t.slug !== excludeSlug);
  const sortedT = [...allTopics].sort((a, b) => b.name.length - a.name.length);

  const topicItems = sortedT.map((t) => ({
    pattern: new RegExp(
      `(?<![\\w"'>])${escapeRegex(t.name)}(?![\\w"'<])`,
      "gi",
    ),
    href: `/topics/${t.slug}`,
    cls: TOPIC_LINK_CLASS,
  }));

  result = linkFirstOccurrence(result, topicItems);

  return result;
}
