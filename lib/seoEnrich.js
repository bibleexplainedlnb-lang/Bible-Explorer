/**
 * SEO Enrichment Engine — Bible Verse Insights
 *
 * Enrichment pipeline (applied after AI generation):
 *  1.  Wrap inline verse citations in <blockquote> if AI didn't already
 *  1b. Link every Book Chapter:Verse reference to internal /bible/ pages
 *  2.  Hybrid inline keyword links — AI-powered (max 5, no repeats):
 *        · 2 simple keyword links  (static match, existing behaviour)
 *        · 3 contextual phrase links (AI-expanded 2–5-word anchor)
 *        · Smart sentence injection when keyword missing from content
 *        · URL priority: guides articles → topic pages → question articles
 *  3.  "Know more:" teaser block after 1st/2nd paragraph
 *  4.  Related Articles section (same category)
 *  5.  Read More section (2 same + 1 different category)
 *
 * Returns { html, usedSlugs }
 */

import { callOpenRouter } from './generator.js';
import { isCategoryActive } from './categories.js';

// ─── Keyword groups for inline article/topic linking ──────────────────────
const KEYWORD_GROUPS = {
  faith:       ['trust in God', 'spiritual confidence', 'faith', 'belief'],
  fear:        ['anxiety', 'worry', 'doubt', 'fear'],
  prayer:      ['talking to God', 'seeking God', 'supplication', 'praying', 'prayer'],
  love:        ['compassion', 'kindness', 'love'],
  forgiveness: ['letting go', 'forgiveness', 'mercy'],
  hope:        ['hope in Christ', 'eternal hope', 'hope'],
  grace:       ['unmerited favour', 'grace', 'mercy of God'],
  salvation:   ['saved', 'redemption', 'salvation'],
};

// Plain-text placeholder sentences for keyword groups that have no published article yet
const PLACEHOLDER_SENTENCES = {
  faith:       'Biblical teaching on faith and trusting God will be explored in detail in a dedicated article.',
  fear:        'Guidance on overcoming anxiety and fear through Scripture will be covered in a dedicated article.',
  prayer:      'A dedicated article on the practice and power of prayer in the Christian life is coming soon.',
  love:        'The biblical understanding of love and compassion will be explored in a dedicated article.',
  forgiveness: 'A dedicated article on biblical forgiveness and letting go will be available soon.',
  hope:        'The hope found in Christ and eternity will be explored in depth in a dedicated article.',
  grace:       'A dedicated article on God\'s grace and unmerited favour is being prepared.',
  salvation:   'The full biblical teaching on salvation and redemption will be covered in a dedicated article.',
};

const VARIATION_LIST = Object.entries(KEYWORD_GROUPS)
  .flatMap(([groupName, variations]) => variations.map(v => ({ groupName, variation: v })))
  .sort((a, b) => b.variation.length - a.variation.length);

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

function findArticleForGroup(groupName, articles) {
  const variations = KEYWORD_GROUPS[groupName] || [];
  for (const variation of variations) {
    const kw = variation.toLowerCase();
    const match = articles.find(a =>
      a.title?.toLowerCase().includes(kw) ||
      a.slug?.toLowerCase().includes(kw.replace(/\s+/g, '-'))
    );
    if (match) return match;
  }
  return null;
}

function replaceFirstVariation(text, variation, href) {
  const escaped = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?<![\\w\\-])${escaped}(?![\\w\\-])`, 'i');
  const match = regex.exec(text);
  if (!match) return { text, replaced: false };
  const original = match[0];
  const before   = text.slice(0, match.index);
  const after    = text.slice(match.index + original.length);
  return { text: `${before}<a href="${href}" class="article-link">${original}</a>${after}`, replaced: true };
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

// ─── URL builder — ONLY links to verified published articles in ACTIVE categories
// Never links to articles whose category is inactive or not in the DB.
function buildGroupUrls(publishedArticles) {
  const groupToUrl = {};
  // Pre-filter: only articles belonging to currently active categories
  const articles = (publishedArticles || []).filter(a => isCategoryActive(a.category));

  for (const groupName of Object.keys(KEYWORD_GROUPS)) {
    // 1. Guides articles (preferred, only if guides category is active)
    if (isCategoryActive('guides')) {
      const guide = findArticleForGroup(groupName, articles.filter(a => a.category === 'guides'));
      if (guide) { groupToUrl[groupName] = `/bible-verses/${guide.slug}/`; continue; }
    }

    // 2. Topics articles (only if topics category is active)
    if (isCategoryActive('topics')) {
      const topic = findArticleForGroup(groupName, articles.filter(a => a.category === 'topics'));
      if (topic) { groupToUrl[groupName] = `/bible-verses/${topic.slug}/`; continue; }
    }

    // 3. Questions articles (only if questions category is active)
    if (isCategoryActive('questions')) {
      const question = findArticleForGroup(groupName, articles.filter(a => a.category === 'questions'));
      if (question) { groupToUrl[groupName] = `/bible-verses/${question.slug}/`; continue; }
    }

    // 4. Any matching published article from an active category as last resort
    const any = findArticleForGroup(groupName, articles);
    if (any) groupToUrl[groupName] = `/bible-verses/${any.slug}/`;
    // If nothing found → groupToUrl[groupName] remains undefined → plain text placeholder used
  }

  return groupToUrl;
}

// ─── Simple keyword link (tokenizer-aware, skips existing anchors) ──────────
function injectKeywordLink(html, variation, href) {
  const tokens = tokenize(html);
  let insideAnchor = 0;
  let replaced = false;

  const resultHtml = tokens.map(token => {
    if (token.type === 'tag') {
      if (/^<a[\s>]/i.test(token.value))  insideAnchor++;
      if (/^<\/a>/i.test(token.value))    insideAnchor = Math.max(0, insideAnchor - 1);
      return token.value;
    }
    if (insideAnchor > 0 || replaced) return token.value;

    const { text, replaced: wasReplaced } = replaceFirstVariation(token.value, variation, href);
    if (wasReplaced) replaced = true;
    return text;
  }).join('');

  return { html: resultHtml, replaced };
}

// ─── Contextual AI-expanded link (2–5 word anchor phrase) ─────────────────
async function injectContextualLink(html, keyword, href) {
  const plain = html.replace(/<[^>]*>/g, ' ');
  const sentences = plain.match(/[^.!?]+[.!?]+/g) || [];
  const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const kwRe = new RegExp(`(?<![\\w\\-])${esc}(?![\\w\\-])`, 'i');
  const targetSentence = sentences.find(s => kwRe.test(s));
  if (!targetSentence) return { html, replaced: false };

  let anchorPhrase = keyword;
  try {
    const raw = await callOpenRouter([{
      role: 'user',
      content: `You are an SEO anchor text specialist for a Christian Bible study website.

Sentence: "${targetSentence.trim()}"
Keyword: "${keyword}"

Extract a natural 2–5 word phrase from the sentence that contains the keyword. The phrase must appear verbatim in the sentence and work as a meaningful hyperlink anchor.

Return JSON only: { "phrase": "the exact phrase" }`,
    }], { json: true });

    const parsed = JSON.parse(raw);
    if (parsed.phrase && typeof parsed.phrase === 'string' && parsed.phrase.trim().split(/\s+/).length >= 2) {
      anchorPhrase = parsed.phrase.trim();
    }
  } catch {
    // fall back to single-keyword anchor
  }

  const phraseEsc = anchorPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const phraseRe  = new RegExp(`(?<![\\w\\-])${phraseEsc}(?![\\w\\-])`, 'i');
  const tokens = tokenize(html);
  let insideAnchor = 0;
  let replaced = false;

  const resultHtml = tokens.map(token => {
    if (token.type === 'tag') {
      if (/^<a[\s>]/i.test(token.value))  insideAnchor++;
      if (/^<\/a>/i.test(token.value))    insideAnchor = Math.max(0, insideAnchor - 1);
      return token.value;
    }
    if (insideAnchor > 0 || replaced) return token.value;

    const m = phraseRe.exec(token.value);
    if (m) {
      replaced = true;
      return (
        token.value.slice(0, m.index) +
        `<a href="${href}" class="article-link">${m[0]}</a>` +
        token.value.slice(m.index + m[0].length)
      );
    }
    return token.value;
  }).join('');

  return { html: resultHtml, replaced };
}

// ─── AI-generated sentence injection (keyword not found in content) ─────────
async function injectGeneratedSentence(html, keyword, href) {
  try {
    const raw = await callOpenRouter([{
      role: 'user',
      content: `Write one natural, human sentence that includes the phrase "${keyword}" in a meaningful emotional or spiritual context for a Christian Bible study article. Keep it conversational and relevant.

Return JSON only: { "sentence": "...", "phrase": "2-5 word anchor from the sentence that contains the keyword" }`,
    }], { json: true });

    const parsed = JSON.parse(raw);
    if (!parsed.sentence || !parsed.phrase) return { html, injected: false };

    const sentence = parsed.sentence.trim();
    let phrase = parsed.phrase.trim();

    if (!sentence.toLowerCase().includes(phrase.toLowerCase())) {
      phrase = keyword;
    }

    const phraseEsc = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const sentenceWithLink = sentence.replace(
      new RegExp(phraseEsc, 'i'),
      m => `<a href="${href}" class="article-link">${m}</a>`
    );

    const firstClose  = html.indexOf('</p>');
    const secondClose = firstClose !== -1 ? html.indexOf('</p>', firstClose + 4) : -1;
    const insertAt    = secondClose !== -1 ? secondClose + 4 : (firstClose !== -1 ? firstClose + 4 : html.length);

    const newHtml =
      html.slice(0, insertAt) +
      `\n<p data-injected="true">${sentenceWithLink}</p>` +
      html.slice(insertAt);

    return { html: newHtml, injected: true };
  } catch {
    return { html, injected: false };
  }
}

// ─── Plain text placeholder for groups with no published article ───────────
function injectPlaceholderParagraph(html, groupName) {
  const sentence = PLACEHOLDER_SENTENCES[groupName];
  if (!sentence) return html;

  const firstClose = html.indexOf('</p>');
  const secondClose = firstClose !== -1 ? html.indexOf('</p>', firstClose + 4) : -1;
  const insertAt = secondClose !== -1 ? secondClose + 4 : (firstClose !== -1 ? firstClose + 4 : html.length);

  return (
    html.slice(0, insertAt) +
    `\n<p class="topic-placeholder">${sentence}</p>` +
    html.slice(insertAt)
  );
}

// ─── Step 2: Hybrid AI inline linking (max 5: 2 keyword + 3 contextual) ────
// STRICT: only links to verified published articles. Groups with no article
// get a plain-text placeholder paragraph instead of a dead link.
async function injectInlineLinksAI(html, publishedArticles) {
  if (!html) return { html, usedSlugs: new Set() };

  const MAX_KEYWORD    = 2;
  const MAX_CONTEXTUAL = 3;
  const MAX_TOTAL      = 5;

  const usedSlugs       = new Set();
  const usedUrls        = new Set();
  const usedGroups      = new Set();
  const placeholderDone = new Set();
  let keywordCount    = 0;
  let contextualCount = 0;

  const groupToUrl = buildGroupUrls(publishedArticles);
  let result = html;

  for (const { groupName, variation } of VARIATION_LIST) {
    if (usedGroups.has(groupName)) continue;

    const url = groupToUrl[groupName];

    // No published article for this group
    if (!url) {
      // Inject a plain text placeholder once per group (no link created)
      if (!placeholderDone.has(groupName)) {
        const plain = result.replace(/<[^>]*>/g, ' ');
        const esc   = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const kwRe  = new RegExp(`(?<![\\w\\-])${esc}(?![\\w\\-])`, 'i');
        if (kwRe.test(plain)) {
          result = injectPlaceholderParagraph(result, groupName);
          placeholderDone.add(groupName);
          usedGroups.add(groupName);
        }
      }
      continue;
    }

    if (keywordCount + contextualCount >= MAX_TOTAL) continue;
    if (usedUrls.has(url)) continue;

    const isKeywordSlot    = keywordCount < MAX_KEYWORD;
    const isContextualSlot = !isKeywordSlot && contextualCount < MAX_CONTEXTUAL;
    if (!isKeywordSlot && !isContextualSlot) continue;

    // Check if keyword appears in plain text
    const plain = result.replace(/<[^>]*>/g, ' ');
    const esc   = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const kwRe  = new RegExp(`(?<![\\w\\-])${esc}(?![\\w\\-])`, 'i');
    const foundInContent = kwRe.test(plain);

    let linked = false;

    if (foundInContent) {
      if (isKeywordSlot) {
        const { html: newHtml, replaced } = injectKeywordLink(result, variation, url);
        if (replaced) { result = newHtml; linked = true; keywordCount++; }
      } else {
        const { html: newHtml, replaced } = await injectContextualLink(result, variation, url);
        if (replaced) { result = newHtml; linked = true; contextualCount++; }
        else {
          const { html: fbHtml, replaced: fbReplaced } = injectKeywordLink(result, variation, url);
          if (fbReplaced) { result = fbHtml; linked = true; contextualCount++; }
        }
      }
    } else {
      // Keyword absent — AI-generate and inject a sentence with the link
      const { html: newHtml, injected } = await injectGeneratedSentence(result, variation, url);
      if (injected) {
        result = newHtml;
        linked = true;
        if (isKeywordSlot) keywordCount++;
        else contextualCount++;
      }
    }

    if (linked) {
      usedGroups.add(groupName);
      usedUrls.add(url);
      if (url.startsWith('/bible-verses/')) {
        usedSlugs.add(url.replace('/bible-verses/', '').replace(/\/$/, ''));
      }
    }
  }

  return { html: result, usedSlugs };
}

// Named export kept for any direct callers (now async)
export async function injectInlineLinks(html, publishedArticles) {
  return injectInlineLinksAI(html, publishedArticles);
}

// ─── Step 3: Know More teaser block ───────────────────────────────────────
export function injectKnowMore(html, publishedArticles, category, currentSlug, excludeSlugs = new Set()) {
  if (!html || !publishedArticles?.length) return { html, usedSlug: null };

  const paragraphs = html.split('</p>');
  if (paragraphs.length < 3) return { html, usedSlug: null };

  const candidate =
    publishedArticles.find(a => a.slug !== currentSlug && !excludeSlugs.has(a.slug) && a.category === category) ||
    publishedArticles.find(a => a.slug !== currentSlug && !excludeSlugs.has(a.slug));
  if (!candidate) return { html, usedSlug: null };

  const firstParaText  = paragraphs[0].replace(/<[^>]*>/g, '').trim();
  const insertAfterIdx = firstParaText.length >= 80 ? 0 : 1;

  const block = `<p class="know-more-block"><strong>Know more:</strong> <a href="/bible-verses/${candidate.slug}/">${candidate.title}</a></p>`;

  const result = paragraphs.map((part, i) => {
    const isLast    = i === paragraphs.length - 1;
    const withClose = isLast ? part : part + '</p>';
    if (i === insertAfterIdx && !isLast) return withClose + block;
    return withClose;
  }).join('');

  return { html: result, usedSlug: candidate.slug };
}

// ─── Step 4: Related Articles (same category, max 3) ──────────────────────
export function injectRelatedArticles(html, publishedArticles, category, currentSlug, excludeSlugs = new Set()) {
  const pool = publishedArticles.filter(a =>
    a.slug !== currentSlug && !excludeSlugs.has(a.slug) && a.category === category
  );
  if (pool.length === 0) return { html, usedSlugs: new Set() };

  const picked    = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  const usedSlugs = new Set(picked.map(a => a.slug));

  const items = picked.map(a => `  <li><a href="/bible-verses/${a.slug}/">${a.title}</a></li>`).join('\n');
  return { html: html + `\n<h3>Related Articles</h3>\n<ul>\n${items}\n</ul>`, usedSlugs };
}

// ─── Step 5: Read More (2 same + 1 different category) ────────────────────
export function injectReadMore(html, publishedArticles, category, excludeSlugs = new Set()) {
  const sameCat = publishedArticles
    .filter(a => !excludeSlugs.has(a.slug) && a.category === category)
    .sort(() => Math.random() - 0.5).slice(0, 2);

  const diffCat = publishedArticles
    .filter(a => !excludeSlugs.has(a.slug) && a.category !== category)
    .sort(() => Math.random() - 0.5).slice(0, 1);

  const picked = [...sameCat, ...diffCat];
  if (picked.length === 0) return html;

  const items = picked.map(a => `  <li><a href="/bible-verses/${a.slug}/">${a.title}</a></li>`).join('\n');
  return html + `\n<h3>Read More</h3>\n<ul>\n${items}\n</ul>`;
}

// ─── Strip existing enrichment (for re-linking) ───────────────────────────
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

  // Unwrap article-link anchors → text (bible-verses, topics, guides, questions paths)
  result = result.replace(/<a\s[^>]*href="\/bible-verses\/[^"]*"[^>]*class="article-link"[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  result = result.replace(/<a\s[^>]*class="article-link"[^>]*href="\/bible-verses\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  result = result.replace(/<a\s[^>]*href="\/topics\/[^"]*"[^>]*class="article-link"[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  result = result.replace(/<a\s[^>]*class="article-link"[^>]*href="\/topics\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$1');

  // Unwrap Bible verse links
  result = result.replace(/\(<a\s[^>]*class="verse-ref"[^>]*>([\s\S]*?)<\/a>\)/gi, '($1)');
  result = result.replace(/<a\s[^>]*class="verse-ref"[^>]*>([\s\S]*?)<\/a>/gi, '$1');

  return result.trim();
}

// ─── Full pipeline ─────────────────────────────────────────────────────────
export async function enrichContent(html, publishedArticles, category, currentSlug) {
  if (!html) return { html, usedSlugs: new Set() };

  const allExcluded = new Set([currentSlug].filter(Boolean));

  // MANDATORY: restrict all linking to articles from active categories only.
  // This is the single enforcement point — every linking step below inherits it.
  const activeArticles = (publishedArticles || []).filter(a => isCategoryActive(a.category));

  // 1. Blockquote wrapping
  let result = injectBibleVerses(html);

  // 1b. Internal Bible verse links
  result = injectBibleVerseLinks(result);

  // 2. Hybrid AI inline links — uses activeArticles (active categories only)
  const { html: linkedHtml, usedSlugs: inlineSlugs } = await injectInlineLinksAI(result, activeArticles);
  result = linkedHtml;
  for (const s of inlineSlugs) allExcluded.add(s);

  if (!activeArticles.length) return { html: result, usedSlugs: allExcluded };

  // 3. Know More — only picks from activeArticles
  const { html: withKnowMore, usedSlug: kmSlug } = injectKnowMore(result, activeArticles, category, currentSlug, allExcluded);
  result = withKnowMore;
  if (kmSlug) allExcluded.add(kmSlug);

  // 4. Related Articles — only picks from activeArticles
  const { html: withRelated, usedSlugs: relatedSlugs } = injectRelatedArticles(result, activeArticles, category, currentSlug, allExcluded);
  result = withRelated;
  for (const s of relatedSlugs) allExcluded.add(s);

  // 5. Read More — only picks from activeArticles
  result = injectReadMore(result, activeArticles, category, allExcluded);

  return { html: result, usedSlugs: allExcluded };
}
