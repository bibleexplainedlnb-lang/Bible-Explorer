/**
 * Smart Internal Linking Engine — Bible Verse Insights
 *
 * Strategy per candidate article:
 *  1. Build slug windows (longest first, down to 2 words) — no stopword filter
 *  2. Build title keyword N-grams (2+ significant words) — stopword filtered
 *  3. Fall back to single strong keyword (len >= 5, not a stopword, unique)
 *  4. First match wins; one link per candidate article; no duplicate URLs.
 *
 * Returns { html, linksAdded }
 */

const STOPWORDS = new Set([
  'the','a','an','in','of','for','to','and','or','is','are','was','were','be',
  'been','being','with','that','this','what','how','why','who','when','where',
  'does','do','did','can','will','would','should','have','has','had','from',
  'by','on','at','as','it','its','not','about','but','you','your','we','our',
  'they','their','into','than','more','some','all','one','also','just','very',
  'which','there','bible','god','lord','jesus','christ','holy','says','say',
  'mean','means','life','live','lives','people','person','true','truth','ways',
  'verse','verses','passage','passages','scripture','scriptures','word','words',
  'book','books','chapter','chapters','prayer','pray','prays','read','reads',
  'reading','believe','belief','believers','follower','followers','text','teach',
  'teaching','teachings','heart','hearts','soul','souls','mind','minds',
  'blessing','blessings','blessed','promise','promises','grace','mercy','love',
  'faith','hope','trust','peace','strength','power','according',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function articleUrl(a) {
  const cat = a.category || '';
  if (cat === 'questions') return `/questions/${a.slug}/`;
  if (cat === 'topics')    return `/topics/${a.slug}/`;
  return `/guides/${a.slug}/`;
}

/**
 * Build consecutive N-word windows from a slug.
 * Longest first (more specific anchors preferred).
 * Minimum window = 2 words.
 * Does NOT filter stopwords — slug words are all intentional.
 */
function buildSlugPhrases(slug) {
  const words = slug.split('-').filter(w => w.length > 0);
  if (words.length === 0) return [];
  const phrases = [];
  const minLen = Math.min(2, words.length);
  for (let len = Math.min(6, words.length); len >= minLen; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      phrases.push(words.slice(i, i + len).join(' '));
    }
  }
  return phrases;
}

/**
 * Build N-grams from significant (non-stopword) words in a title.
 * Minimum 2 significant words. Falls back to single strong keyword.
 */
function buildTitlePhrases(title) {
  const sigWords = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));

  if (sigWords.length === 0) return [];

  // Single strong keyword fallback (length >= 5, keeps it specific)
  if (sigWords.length === 1) {
    return sigWords[0].length >= 5 ? [sigWords[0]] : [];
  }

  const phrases = [];
  const minLen = Math.min(2, sigWords.length);
  for (let len = Math.min(6, sigWords.length); len >= minLen; len--) {
    for (let i = 0; i <= sigWords.length - len; i++) {
      phrases.push(sigWords.slice(i, i + len).join(' '));
    }
  }
  return phrases;
}

/**
 * Tokenize raw HTML into {type:'tag'} and {type:'text'} tokens.
 */
function tokenizeHtml(html) {
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

/**
 * Build a case-insensitive word-boundary regex for a phrase.
 * Each word may optionally be followed by 's or '.
 * For single words, also allow common suffixes (-ing, -ed, -s, -ly).
 */
function buildPhraseRegex(phrase) {
  const words = phrase.split(/\s+/);
  if (words.length === 1) {
    // Single keyword: match the base word + common inflections
    const base = escapeRegex(words[0]);
    return new RegExp(`(?<![a-zA-Z])(${base}(?:ing|ed|tion|ly|s|'s)?)(?![a-zA-Z])`, 'i');
  }
  const parts = words.map(w => `${escapeRegex(w)}(?:['\u2019]s?)?`);
  return new RegExp(`(?<![a-zA-Z])(${parts.join('\\s+')})(?![a-zA-Z])`, 'i');
}

/**
 * Try to replace the FIRST occurrence of `phrase` in the HTML body text.
 * Skips text inside <a>, <blockquote>, <h1>-<h6> tags.
 */
function replaceFirstPhrase(html, phrase, linkUrl) {
  const tokens    = tokenizeHtml(html);
  const re        = buildPhraseRegex(phrase);
  let   skipDepth = 0;
  let   replaced  = false;

  const out = tokens.map(token => {
    if (token.type === 'tag') {
      if (/^<(a|blockquote|h[1-6])[\s>]/i.test(token.value)) skipDepth++;
      if (/^<\/(a|blockquote|h[1-6])>/i.test(token.value))   skipDepth = Math.max(0, skipDepth - 1);
      return token.value;
    }
    if (replaced || skipDepth > 0) return token.value;

    return token.value.replace(re, (full, captured) => {
      if (replaced) return full;
      replaced = true;
      return `<a href="${linkUrl}" class="article-link" style="color:#1a56db;text-decoration:underline">${captured}</a>`;
    });
  });

  return { html: out.join(''), replaced };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * interlinkArticle(article, pool)
 *
 * @param article  { id, slug, title, content, topic_id, category, parentTopicId }
 * @param pool     Array of { id, slug, title, topic_id, parent_topic_id, category, is_pillar }
 * @returns        { html, linksAdded }
 */
export function interlinkArticle(article, pool) {
  const selfSlug     = article.slug || '';
  const selfCat      = article.category || '';
  const selfTopicId  = article.topic_id || null;
  const selfParentId = article.parentTopicId || article.parent_topic_id || null;

  const usedUrls = new Set();

  // ── Build scored candidate list ───────────────────────────────────────────
  const candidates = pool
    .filter(a => a.slug !== selfSlug && a.title && a.slug)
    .map(a => {
      const cat     = a.category || '';
      const topicId = a.topic_id  || null;
      const parId   = a.parent_topic_id || null;

      let score = 0;
      if (topicId && topicId === selfTopicId)                    score += 10;
      else if (selfParentId && parId && parId === selfParentId)  score += 6;
      else if (selfParentId && topicId === selfParentId)         score += 5;
      else if (cat === selfCat)                                  score += 3;
      else                                                       score += 1;
      if (a.is_pillar) score += 0.5;

      return { url: articleUrl(a), title: a.title, slug: a.slug, score };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  let html        = article.content || '';
  let inlineAdded = 0;

  // ── Inline phrase linking ─────────────────────────────────────────────────
  for (const candidate of candidates) {
    if (usedUrls.has(candidate.url)) continue;

    // Slug phrases: all consecutive windows 6→2 words (no stopword filter)
    const slugPhrases  = buildSlugPhrases(candidate.slug);
    // Title phrases: significant-word N-grams 2+ words, plus single strong keyword fallback
    const titlePhrases = buildTitlePhrases(candidate.title);

    // Deduplicate — slug phrases take priority (more specific)
    const seen       = new Set(slugPhrases);
    const allPhrases = [
      ...slugPhrases,
      ...titlePhrases.filter(p => !seen.has(p)),
    ];

    for (const phrase of allPhrases) {
      const { html: newHtml, replaced } = replaceFirstPhrase(html, phrase, candidate.url);
      if (replaced) {
        html = newHtml;
        usedUrls.add(candidate.url);
        inlineAdded++;
        break;
      }
    }
  }

  return { html, linksAdded: inlineAdded };
}
