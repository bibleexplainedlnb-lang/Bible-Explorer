/**
 * Smart Internal Linking Engine — Bible Verse Insights
 *
 * Strict rules enforced for every internal link:
 *   • NO single-word links — minimum 2 words
 *   • NO all-stopword phrases — every phrase MUST contain ≥2 content words
 *     (a "content word" is ≥3 chars AND not in the STOPWORDS set)
 *   • Ideal phrase length 3–6 words; 2 words allowed only when ≥2 content words
 *   • Match context — candidates are scored by topic / parent / category overlap
 *   • Insert phrase if missing — for high-relevance candidates whose phrase
 *     never appears in the body, append a short contextual sentence (capped
 *     to MAX_INSERTS per article) so the link is still made
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

const MIN_WORDS  = 2;   // Hard floor: NO single-word links, ever.
const MAX_WORDS  = 6;   // Anchors longer than this read as full sentences.
const IDEAL_MIN  = 3;   // Sweet spot start.
const IDEAL_MAX  = 6;   // Sweet spot end.
const MIN_CONTENT_WORDS = 2;  // ≥2 non-stopword words in every phrase.
const MAX_INSERTS = 3;        // Cap on "insert sentence if missing" per article.

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isContentWord(w) {
  return w.length >= 3 && !STOPWORDS.has(w);
}

/**
 * Resolve the public URL for an article based on its category.
 * Supports all five article categories; falls back to /guides/ for safety.
 */
function articleUrl(a) {
  const cat = a.category || '';
  if (cat === 'questions')         return `/questions/${a.slug}/`;
  if (cat === 'topics')            return `/topics/${a.slug}/`;
  if (cat === 'bible-verses')      return `/bible-verses/${a.slug}/`;
  if (cat === 'bible-characters')  return `/bible-characters/${a.slug}/`;
  return `/guides/${a.slug}/`;
}

/**
 * A phrase is valid only if:
 *   - 2 ≤ word count ≤ 6
 *   - At least MIN_CONTENT_WORDS non-stopword content words
 * This rules out "the bible", "what does", "of god", etc.
 */
function isValidPhrase(phrase) {
  const words = phrase.split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORDS || words.length > MAX_WORDS) return false;
  const contentCount = words.filter(isContentWord).length;
  return contentCount >= MIN_CONTENT_WORDS;
}

/**
 * Score a phrase. Higher = better anchor text.
 *   - Sweet-spot length (3–6 words) gets the biggest boost
 *   - More content words = higher score
 *   - Title-derived phrases beat slug-derived (read more naturally)
 */
function scorePhrase(phrase, source) {
  const words   = phrase.split(/\s+/).filter(Boolean);
  const content = words.filter(isContentWord).length;
  let lenScore  = 0;
  if (words.length >= IDEAL_MIN && words.length <= IDEAL_MAX) lenScore = 10;
  else if (words.length === 2)                                lenScore = 4;
  return lenScore + content * 2 + (source === 'title' ? 2 : 0);
}

/**
 * Generate consecutive N-word windows from a word array.
 */
function ngrams(words, minN, maxN) {
  const out = [];
  const max = Math.min(maxN, words.length);
  for (let n = max; n >= minN; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      out.push(words.slice(i, i + n).join(' '));
    }
  }
  return out;
}

/**
 * Build the ranked list of valid anchor phrases for a candidate article.
 * Pulls candidates from BOTH the title (preferred) and slug, dedupes, scores,
 * and returns them best-first. Returns [] when no rule-compliant phrase exists.
 */
function buildPhrases(candidate) {
  const titleWords = (candidate.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const slugWords = (candidate.slug || '').split('-').filter(Boolean);

  const scored = new Map(); // phrase → score (best-of)
  const consider = (phrase, source) => {
    if (!isValidPhrase(phrase)) return;
    const s = scorePhrase(phrase, source);
    if (!scored.has(phrase) || scored.get(phrase) < s) scored.set(phrase, s);
  };

  for (const p of ngrams(titleWords, MIN_WORDS, MAX_WORDS)) consider(p, 'title');
  for (const p of ngrams(slugWords,  MIN_WORDS, MAX_WORDS)) consider(p, 'slug');

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)
    .map(([p]) => p);
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
 * Build a case-insensitive, word-boundary regex for a multi-word phrase.
 * Each word may optionally be followed by 's or '. Single-word path removed
 * intentionally — single-word links are forbidden by the strict rules.
 */
function buildPhraseRegex(phrase) {
  const words = phrase.split(/\s+/).filter(Boolean);
  const parts = words.map(w => `${escapeRegex(w)}(?:['\u2019]s?)?`);
  return new RegExp(`(?<![a-zA-Z])(${parts.join('\\s+')})(?![a-zA-Z])`, 'i');
}

/**
 * Replace the FIRST occurrence of `phrase` in body text with a link.
 * Skips text inside <a>, <blockquote>, and <h1>–<h6> tags.
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

/**
 * Capitalize the first letter of every word — used when the phrase is being
 * inserted as fresh prose (not matched against existing body text).
 */
function titleCase(phrase) {
  return phrase.replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Build a tasteful contextual sentence to append at the end of the article
 * when a high-relevance candidate's phrase isn't naturally present in the body.
 * The paragraph carries data-injected="true" so the existing stripper removes
 * it cleanly on re-link.
 */
function buildInsertSentence(url, phrase) {
  const cap = titleCase(phrase);
  return `<p data-injected="true">For deeper study, read about <a href="${url}" class="article-link" style="color:#1a56db;text-decoration:underline">${cap}</a>.</p>`;
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

      return { url: articleUrl(a), title: a.title, slug: a.slug, category: cat, score };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  let html        = article.content || '';
  let linksAdded  = 0;

  // ── Pass 1: inline phrase linking ────────────────────────────────────────
  // For each candidate, try its ranked phrases against the body text. First
  // valid phrase that appears wins. One link per candidate. No URL duplicates.
  const unmatched = []; // candidates with no phrase found in the body
  for (const candidate of candidates) {
    if (usedUrls.has(candidate.url)) continue;
    const phrases = buildPhrases(candidate);
    if (phrases.length === 0) continue; // no rule-compliant phrase exists

    let matched = false;
    for (const phrase of phrases) {
      const { html: newHtml, replaced } = replaceFirstPhrase(html, phrase, candidate.url);
      if (replaced) {
        html = newHtml;
        usedUrls.add(candidate.url);
        linksAdded++;
        matched = true;
        break;
      }
    }
    if (!matched) unmatched.push({ candidate, phrases });
  }

  // ── Pass 2: insert phrase if missing (capped) ────────────────────────────
  // For the highest-relevance unmatched candidates, append a short contextual
  // sentence at the end of the article body and link the phrase. Only insert
  // when the candidate shares the SAME topic (score ≥ 10) — sharing only a
  // parent topic is too broad in flat taxonomies, and inserting unrelated
  // sentences would harm UX and SEO. Never exceed MAX_INSERTS per article.
  let inserts = 0;
  for (const { candidate, phrases } of unmatched) {
    if (inserts >= MAX_INSERTS) break;
    if (candidate.score < 10) break; // candidates are pre-sorted by score desc
    if (usedUrls.has(candidate.url)) continue;
    const phrase = phrases[0]; // best phrase per scoring
    if (!phrase) continue;
    html += buildInsertSentence(candidate.url, phrase);
    usedUrls.add(candidate.url);
    linksAdded++;
    inserts++;
  }

  return { html, linksAdded };
}
