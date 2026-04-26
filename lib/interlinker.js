/**
 * Smart Internal Linking Engine — Bible Verse Insights
 *
 * Inline phrase linking only (slug-phrase based):
 *   For each candidate article (sorted by relevance):
 *   1. Build 4-6 word consecutive windows from the candidate's URL slug.
 *   2. Also build 4-6 word N-grams from the candidate's title significant words.
 *   3. Try each phrase verbatim (case-insensitive, word-boundary) in the body text.
 *   4. If found, wrap that EXACT matched text with the link.
 *   NEVER use context expansion (no grabbing surrounding stopwords).
 *   NEVER link a phrase shorter than 4 words.
 *
 * Bottom link sections (Read More / Related Articles / Explore More) are rendered
 * server-side by the article page component, not injected here.
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function articleUrl(a) {
  return `/${a.category}/${a.slug}/`;
}

/**
 * Build consecutive N-word windows (length 4-6) from a URL slug.
 * Longer windows come first (more specific anchors preferred).
 */
function buildSlugPhrases(slug) {
  const words = slug.split('-').filter(w => w.length > 0);
  const phrases = [];
  for (let len = Math.min(6, words.length); len >= 4; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      phrases.push(words.slice(i, i + len).join(' '));
    }
  }
  return phrases;
}

/**
 * Build N-grams (length 4-6) from significant (non-stopword) words in a title.
 */
function buildTitlePhrases(title) {
  const sigWords = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
  if (sigWords.length < 4) return [];
  const phrases = [];
  for (let len = Math.min(6, sigWords.length); len >= 4; len--) {
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
 * Build a regex for a phrase that:
 * - Is case-insensitive
 * - Requires word boundaries
 * - Allows optional possessive suffix ('s) on any word
 * - Allows any whitespace between words
 */
function buildPhraseRegex(phrase) {
  const parts = phrase.split(/\s+/).map(w => `${escapeRegex(w)}(?:['\u2019]s?)?`);
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
  const selfSlug    = article.slug || '';
  const selfCat     = article.category || '';
  const selfTopicId = article.topic_id || null;
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
      if (topicId && topicId === selfTopicId)                   score += 10;
      else if (selfParentId && parId && parId === selfParentId) score += 6;
      else if (selfParentId && topicId === selfParentId)        score += 5;
      else if (cat === selfCat)                                  score += 3;
      else                                                       score += 1;
      if (a.is_pillar) score += 0.5;

      return {
        url:   articleUrl(a),
        title: a.title,
        slug:  a.slug,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  let html        = article.content || '';
  let inlineAdded = 0;

  // ── Inline phrase linking (slug-phrase based) ─────────────────────────────
  for (const candidate of candidates) {
    if (usedUrls.has(candidate.url)) continue;

    const slugPhrases  = buildSlugPhrases(candidate.slug);
    const titlePhrases = buildTitlePhrases(candidate.title);
    const seen = new Set(slugPhrases);
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
