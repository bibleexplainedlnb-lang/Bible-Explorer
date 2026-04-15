/**
 * SEO Enrichment Engine — Bible Verse Insights
 *
 * Enrichment pipeline (applied after AI generation):
 *  1.  Wrap inline verse citations in <blockquote> if AI didn't already
 *  1b. Link every Book Chapter:Verse reference to internal /bible/ pages
 *
 * All automatic article interlinking (keyword links, Know More, Related Articles,
 * Read More) has been removed. Only Bible verse references are linked.
 *
 * Returns { html, usedSlugs }
 */

// ─── Bible book → internal URL slug ───────────────────────────────────────
const BOOK_ALIASES = {
  'psalm': 'psalms',
  'song of solomon': 'songofsolomon',
  'song of songs':   'songofsolomon',
};

const KNOWN_BOOKS = new Set([
  'genesis','exodus','leviticus','numbers','deuteronomy','joshua','judges','ruth',
  '1samuel','2samuel','1kings','2kings','1chronicles','2chronicles',
  'ezra','nehemiah','esther','job','psalms','proverbs','ecclesiastes',
  'songofsolomon','isaiah','jeremiah','lamentations','ezekiel','daniel',
  'hosea','joel','amos','obadiah','jonah','micah','nahum','habakkuk',
  'zephaniah','haggai','zechariah','malachi',
  'matthew','mark','luke','john','acts','romans',
  '1corinthians','2corinthians','galatians','ephesians','philippians',
  'colossians','1thessalonians','2thessalonians','1timothy','2timothy',
  'titus','philemon','hebrews','james','1peter','2peter',
  '1john','2john','3john','jude','revelation',
]);

function bookToSlug(bookName) {
  const lower = bookName.toLowerCase().trim();
  if (BOOK_ALIASES[lower]) return BOOK_ALIASES[lower];
  return lower.replace(/\s+/g, '');
}

function verseRefToUrl(ref) {
  const match = ref.match(/^((?:[1-3]\s)?[A-Za-z]+(?:\s[A-Za-z]+){0,2})\s(\d+):\d+/);
  if (!match) return null;
  const slug = bookToSlug(match[1]);
  if (!KNOWN_BOOKS.has(slug)) return null;
  return `/bible/${slug}/${match[2]}/`;
}

const VERSE_REF_PATTERN = `(?:[1-3]\\s)?[A-Z][a-zA-Z]+(?:\\s[A-Z][a-zA-Z]+){0,2}\\s\\d+:\\d+(?:[\\-–]\\d+)?`;
const VERSE_COMBINED_RE = new RegExp(
  `\\((${VERSE_REF_PATTERN})\\)|\\b(${VERSE_REF_PATTERN})\\b`,
  'g'
);

const VERSE_CITATION_RE = /["""]([^"""]{10,200})["""]\s*\(([A-Z1-3][a-zA-Z]+(?: [A-Z][a-zA-Z]+)? \d+:\d+(?:[–\-]\d+)?)\)/g;

// ─── HTML tokenizer ────────────────────────────────────────────────────────
function tokenize(html) {
  const tokens = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) { tokens.push({ type: 'text', value: html.slice(i) }); break; }
      tokens.push({ type: 'tag', value: html.slice(i, end + 1) });
      i = end + 1;
    } else {
      const next = html.indexOf('<', i);
      const end  = next === -1 ? html.length : next;
      tokens.push({ type: 'text', value: html.slice(i, end) });
      i = end;
    }
  }
  return tokens;
}

// ─── Step 1: Wrap inline verse citations in <blockquote> ──────────────────
export function injectBibleVerses(html) {
  if (!html) return html;
  if (/<blockquote/i.test(html)) return html;

  let skipDepth = 0;
  const tokens  = tokenize(html);
  return tokens.map(token => {
    if (token.type === 'tag') {
      if (/^<(blockquote|a)[\s>]/i.test(token.value))  skipDepth++;
      if (/^<\/(blockquote|a)>/i.test(token.value))    skipDepth = Math.max(0, skipDepth - 1);
      return token.value;
    }
    if (skipDepth > 0) return token.value;
    return token.value.replace(VERSE_CITATION_RE, (_, verse, ref) =>
      `<blockquote>\u201c${verse}\u201d (${ref})</blockquote>`
    );
  }).join('');
}

// ─── Step 1b: Link every verse reference to internal /bible/ pages ─────────
export function injectBibleVerseLinks(html) {
  if (!html) return html;

  let insideAnchor = 0;
  const tokens = tokenize(html);

  return tokens.map(token => {
    if (token.type === 'tag') {
      if (/^<a[\s>]/i.test(token.value))   insideAnchor++;
      if (/^<\/a>/i.test(token.value))     insideAnchor = Math.max(0, insideAnchor - 1);
      return token.value;
    }
    if (insideAnchor > 0) return token.value;

    return token.value.replace(VERSE_COMBINED_RE, (match, parenRef, bareRef) => {
      const ref = parenRef || bareRef;
      const url = verseRefToUrl(ref);
      if (!url) return match;

      const link = `<a href="${url}" class="verse-ref">${ref}</a>`;
      return parenRef ? `(${link})` : link;
    });
  }).join('');
}

// ─── Strip existing enrichment (for re-processing or cleanup) ─────────────
export function stripArticleLinks(html) {
  if (!html) return html;

  let result = html;

  // Remove AI-injected linking sentences
  result = result.replace(/<p data-injected="true">[\s\S]*?<\/p>/gi, '');

  // Remove Know More blocks
  result = result.replace(/<p class="know-more-block">[\s\S]*?<\/p>/gi, '');

  // Remove plain-text topic placeholder paragraphs
  result = result.replace(/<p class="topic-placeholder">[\s\S]*?<\/p>/gi, '');

  // Remove Related Articles and Read More h3+ul sections
  result = result.replace(/<h3>(Related Articles|Read More)<\/h3>\s*<ul>[\s\S]*?<\/ul>/gi, '');

  // Unwrap article-link anchors → plain text
  result = result.replace(/<a\s[^>]*href="\/bible-verses\/[^"]*"[^>]*class="article-link"[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  result = result.replace(/<a\s[^>]*class="article-link"[^>]*href="\/bible-verses\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  result = result.replace(/<a\s[^>]*href="\/topics\/[^"]*"[^>]*class="article-link"[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  result = result.replace(/<a\s[^>]*class="article-link"[^>]*href="\/topics\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$1');

  // Unwrap Bible verse links (keep the text, drop the anchor)
  result = result.replace(/\(<a\s[^>]*class="verse-ref"[^>]*>([\s\S]*?)<\/a>\)/gi, '($1)');
  result = result.replace(/<a\s[^>]*class="verse-ref"[^>]*>([\s\S]*?)<\/a>/gi, '$1');

  return result.trim();
}

// ─── Full pipeline ─────────────────────────────────────────────────────────
// Only wraps verse citations in blockquotes and links Bible references.
// No automatic article interlinking — add internal links manually in the editor.
export async function enrichContent(html) {
  if (!html) return { html, usedSlugs: new Set() };

  // 1. Blockquote wrapping for quoted verse citations
  let result = injectBibleVerses(html);

  // 1b. Link bare Bible verse references to /bible/ reading pages
  result = injectBibleVerseLinks(result);

  return { html: result, usedSlugs: new Set() };
}
