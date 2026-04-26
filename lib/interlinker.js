/**
 * Smart Internal Linking Engine — Bible Verse Insights
 *
 * Strategy:
 *  Phase 1 — Inline phrase linking inside paragraph text:
 *    - For each candidate article (sorted by relevance), extract 2-4 word phrases
 *      from its title and search for those phrases inside the article's body text.
 *    - If a phrase from the title is found verbatim, wrap it with a link.
 *    - If no exact phrase found, find a significant keyword from the title,
 *      then expand the match to include 1-2 surrounding words to form a
 *      2-4 word anchor phrase.  NEVER link a single bare word.
 *    - Each URL is used at most ONCE across the entire page.
 *
 *  Phase 2 — Bottom link sections (only articles not already linked inline):
 *    - Related Articles (same topic/parent topic)
 *    - Read More (same category, different topic family)
 *    - Explore More (different category)
 *
 *  All links: style="color:#1a56db;text-decoration:underline"
 *  No minimum or maximum cap on number of inline links.
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
  // Generic Bible-content words — too common to serve as useful linking anchors
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

/** Extract meaningful words from a title (non-stopwords, 4+ chars). */
function extractSignificantWords(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !STOPWORDS.has(w));
}

/**
 * Build ordered list of N-grams from an array of words.
 * Longer N-grams come first (more specific anchor text is better).
 */
function buildNgrams(words) {
  const result = [];
  for (let n = Math.min(4, words.length); n >= 2; n--) {
    for (let i = 0; i <= words.length - n; i++) {
      result.push(words.slice(i, i + n).join(' '));
    }
  }
  return result;
}

/**
 * Tokenize raw HTML into tag tokens and text tokens.
 * This lets us safely operate on text without touching tag attributes.
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
 * Attempt to replace the FIRST occurrence of `phrase` in the HTML body text.
 * Skips text inside <a>, <blockquote>, <h2>, <h3> tags.
 * Returns { html, replaced }.
 */
function replaceFirstPhrase(html, phrase, linkUrl) {
  const tokens    = tokenizeHtml(html);
  let   skipDepth = 0;
  let   replaced  = false;

  const out = tokens.map(token => {
    if (token.type === 'tag') {
      if (/^<(a|blockquote|h[1-6])[\s>]/i.test(token.value)) skipDepth++;
      if (/^<\/(a|blockquote|h[1-6])>/i.test(token.value))   skipDepth = Math.max(0, skipDepth - 1);
      return token.value;
    }

    if (replaced || skipDepth > 0) return token.value;

    // Word-boundary aware, case-insensitive match (no 'g' flag → only first match)
    const re = new RegExp(`(?<![a-zA-Z])${escapeRegex(phrase)}(?![a-zA-Z])`, 'i');
    return token.value.replace(re, match => {
      if (replaced) return match; // only first replacement across all tokens
      replaced = true;
      return `<a href="${linkUrl}" class="article-link" style="color:#1a56db;text-decoration:underline">${match}</a>`;
    });
  });

  return { html: out.join(''), replaced };
}

/**
 * Find a single keyword in the HTML plain text and expand to a 2-4 word phrase
 * by including up to 2 words before and 2 words after it.
 * Returns null if the keyword isn't found or the resulting phrase is only 1 word.
 */
function findContextPhrase(html, keyword) {
  // Work on plain text only
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const kw    = escapeRegex(keyword);

  // Capture up to 2 words before, the keyword, up to 2 words after
  // Words are sequences of letters/apostrophes — no digits, no punctuation-only strings
  const re = new RegExp(
    `(?:(?:[A-Za-z']{2,})\\s+){0,2}${kw}(?:\\s+[A-Za-z']{2,}){0,2}`,
    'i'
  );
  const m = plain.match(re);
  if (!m) return null;

  // Clean leading/trailing punctuation
  const phrase = m[0].trim().replace(/^[,;:.!?'"]+|[,;:.!?'"]+$/g, '').trim();
  if (phrase.split(/\s+/).length < 2) return null;

  return phrase;
}

/**
 * Build a bottom link-list section.
 */
function buildSection(heading, articles) {
  if (!articles.length) return '';
  const items = articles
    .map(a =>
      `  <li style="margin-bottom:0.5rem"><a href="${a.url}" class="article-link" style="color:#1a56db;text-decoration:underline">${a.title}</a></li>`
    )
    .join('\n');
  return (
    `\n<h3 data-injected="true" style="font-family:Georgia,serif;font-size:1.05rem;color:#1e2d4a;` +
    `margin:1.5rem 0 0.75rem;padding-top:1.5rem;border-top:1px solid #e8dfc8">${heading}</h3>` +
    `\n<ul data-injected="true" style="list-style:none;padding:0;margin:0 0 1rem">\n${items}\n</ul>`
  );
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
  const selfTopicId  = article.topic_id   || null;
  const selfParentId = article.parentTopicId || article.parent_topic_id || null;

  // Tracks every URL already linked anywhere on this page
  const usedUrls = new Set();

  // ── Build scored candidate list ───────────────────────────────────────────
  const candidates = pool
    .filter(a => a.slug !== selfSlug && a.title)
    .map(a => {
      const cat     = a.category || '';
      const topicId = a.topic_id  || null;
      const parId   = a.parent_topic_id || null;

      let score = 0;
      if (topicId && topicId === selfTopicId)                              score += 10;
      else if (selfParentId && parId && parId === selfParentId)            score += 6;
      else if (selfParentId && topicId === selfParentId)                   score += 5;
      else if (cat === selfCat)                                            score += 3;
      else                                                                  score += 1;
      if (a.is_pillar) score += 0.5;

      return {
        url:      articleUrl(a),
        title:    a.title,
        category: cat,
        topicId,
        parId,
        isPillar: !!a.is_pillar,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  let html           = article.content || '';
  let inlineAdded    = 0;

  // ── Phase 1: Inline phrase linking ────────────────────────────────────────
  for (const candidate of candidates) {
    if (usedUrls.has(candidate.url)) continue;

    const sigWords = extractSignificantWords(candidate.title);
    if (sigWords.length === 0) continue;

    let linked = false;

    // 1a. Try N-grams built from the candidate's title keywords (longest first)
    for (const ngram of buildNgrams(sigWords)) {
      const { html: newHtml, replaced } = replaceFirstPhrase(html, ngram, candidate.url);
      if (replaced) {
        html = newHtml;
        usedUrls.add(candidate.url);
        inlineAdded++;
        linked = true;
        break;
      }
    }

    if (linked) continue;

    // 1b. Fall back: find individual significant keyword → expand to 2-4 word context phrase
    for (const word of sigWords) {
      const phrase = findContextPhrase(html, word);
      if (!phrase) continue;
      if (phrase.split(/\s+/).length < 2) continue; // enforce phrase minimum

      const { html: newHtml, replaced } = replaceFirstPhrase(html, phrase, candidate.url);
      if (replaced) {
        html = newHtml;
        usedUrls.add(candidate.url);
        inlineAdded++;
        linked = true;
        break;
      }
    }
  }

  // ── Phase 2: Bottom sections (only URLs not already used inline) ──────────
  function pickUnused(n, filter = () => true) {
    const picks = [];
    for (const c of candidates) {
      if (picks.length >= n) break;
      if (!usedUrls.has(c.url) && filter(c)) picks.push(c);
    }
    return picks;
  }
  // Mark immediately after each pick to prevent any article appearing twice
  function markAndPick(n, filter = () => true) {
    const picks = pickUnused(n, filter);
    picks.forEach(p => usedUrls.add(p.url));
    return picks;
  }

  const isSameFamily = c =>
    c.topicId === selfTopicId ||
    (selfParentId && (c.parId === selfParentId || c.topicId === selfParentId));

  // Related Articles: same topic family, supplemented to min 3
  let relatedPicks = markAndPick(8, isSameFamily);
  if (relatedPicks.length < 3) {
    relatedPicks = [...relatedPicks, ...markAndPick(3 - relatedPicks.length, c => c.category === selfCat)];
  }
  if (relatedPicks.length < 3) {
    relatedPicks = [...relatedPicks, ...markAndPick(3 - relatedPicks.length)];
  }

  // Read More: same category, supplemented to min 3
  let readMorePicks = markAndPick(6, c => c.category === selfCat);
  if (readMorePicks.length < 3) {
    readMorePicks = [...readMorePicks, ...markAndPick(3 - readMorePicks.length)];
  }

  // Explore More: different category, supplemented to min 3
  let explorePicks = markAndPick(4, c => c.category !== selfCat);
  if (explorePicks.length < 3) {
    explorePicks = [...explorePicks, ...markAndPick(3 - explorePicks.length)];
  }

  const bottomHtml =
    buildSection('Related Articles', relatedPicks) +
    buildSection('Read More',        readMorePicks) +
    buildSection('Explore More',     explorePicks);

  if (bottomHtml.trim()) html += bottomHtml;

  const linksAdded = inlineAdded + relatedPicks.length + readMorePicks.length + explorePicks.length;
  return { html, linksAdded };
}
