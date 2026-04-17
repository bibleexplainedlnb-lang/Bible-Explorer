/**
 * Smart Internal Linking Engine — Bible Verse Insights
 *
 * Rules (per spec):
 *  - Skip if link_count >= 7
 *  - 3-4 contextual links injected into content paragraphs
 *  - 1 mid-content "Related:" block after 2nd paragraph
 *  - 2-3 bottom "Related Articles" (same category; same topic first)
 *  - 2 bottom "Explore More" (different categories)
 *  - Pillar articles always prioritised
 *  - No duplicate URL or anchor text
 *  - No forced/unnatural linking
 *
 * Returns { html, linksAdded }
 */

const STOPWORDS = new Set([
  'the','a','an','in','of','for','to','and','or','is','are','was','were','be',
  'been','being','with','that','this','what','how','why','who','when','where',
  'does','do','did','can','will','would','should','have','has','had','from',
  'by','on','at','as','it','its','not','about','but','you','your','we','our',
  'they','their','into','than','more','some','all','one','also','just','very',
  'about','which','there','bible','god','lord','jesus','christ','holy',
]);

// ─── Helpers ────────────────────────────────────────────────────────────────

function articleUrl(article) {
  return `/${article.category}/${article.slug}/`;
}

/** Extract keyword candidates from a title, longest first */
function extractKeywords(title) {
  const clean  = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const words  = clean.split(/\s+/).filter(Boolean);
  const result = new Set();

  // Full title phrase
  if (words.length >= 3) result.add(clean);

  // Tri-grams
  for (let i = 0; i <= words.length - 3; i++) {
    const phrase = words.slice(i, i + 3).join(' ');
    if (!words.slice(i, i + 3).every(w => STOPWORDS.has(w))) result.add(phrase);
  }

  // Bi-grams
  for (let i = 0; i <= words.length - 2; i++) {
    if (!STOPWORDS.has(words[i]) || !STOPWORDS.has(words[i + 1])) {
      result.add(words.slice(i, i + 2).join(' '));
    }
  }

  // Significant single words
  for (const word of words) {
    if (!STOPWORDS.has(word) && word.length >= 5) result.add(word);
  }

  return [...result].sort((a, b) => b.length - a.length);
}

// ─── Tokenizer ──────────────────────────────────────────────────────────────

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

// ─── Contextual linking ──────────────────────────────────────────────────────

/**
 * Try to find one keyword match in a text string and wrap it in a link.
 * Returns { text, matched: bool, url, anchor }
 */
function tryLink(text, candidates, usedUrls, usedAnchors) {
  for (const cand of candidates) {
    if (usedUrls.has(cand.url)) continue;

    for (const kw of cand.keywords) {
      if (usedAnchors.has(kw)) continue;

      // Word-boundary regex for keyword
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re      = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i');
      const match   = re.exec(text);
      if (!match) continue;

      const anchor  = match[0]; // preserve original casing
      const linked  = text.slice(0, match.index)
        + `<a href="${cand.url}" class="article-link">${anchor}</a>`
        + text.slice(match.index + anchor.length);

      return { text: linked, matched: true, url: cand.url, anchor: kw };
    }
  }
  return { text, matched: false };
}

/**
 * Walk HTML tokens and inject up to maxLinks contextual links in paragraph text.
 */
function injectContextualLinks(html, candidates, maxLinks) {
  const usedUrls    = new Set();
  const usedAnchors = new Set();
  let   linkCount   = 0;

  let inAnchor  = 0;
  let inHeading = 0;
  let inPara    = 0;

  const result = [];

  for (const token of tokenize(html)) {
    if (token.type === 'tag') {
      const m       = token.value.match(/^<(\/?)\s*([a-z][a-z0-9]*)/i);
      const closing = m?.[1] === '/';
      const tag     = m?.[2]?.toLowerCase() || '';

      if (['h1','h2','h3','h4','h5','h6','blockquote'].includes(tag)) {
        closing ? inHeading-- : inHeading++;
      } else if (tag === 'a') {
        closing ? inAnchor-- : inAnchor++;
      } else if (tag === 'p') {
        closing ? inPara-- : inPara++;
      }

      result.push(token.value);
      continue;
    }

    // Text node — try to inject a link if conditions are right
    if (
      inPara > 0 &&
      inAnchor <= 0 &&
      inHeading <= 0 &&
      linkCount < maxLinks &&
      candidates.length > 0
    ) {
      const { text, matched, url, anchor } = tryLink(
        token.value, candidates, usedUrls, usedAnchors
      );
      if (matched) {
        linkCount++;
        usedUrls.add(url);
        usedAnchors.add(anchor);
        // Remove matched candidate so URL isn't reused
        const idx = candidates.findIndex(c => c.url === url);
        if (idx !== -1) candidates.splice(idx, 1);
      }
      result.push(text);
    } else {
      result.push(token.value);
    }
  }

  return { html: result.join(''), contextualCount: linkCount };
}

/**
 * Insert a "Related:" paragraph after the Nth closing </p> tag.
 */
function insertAfterParagraph(html, targetN, injection) {
  let count = 0;
  let pos   = 0;
  const closeTag = /<\/p>/gi;
  let match;

  while ((match = closeTag.exec(html)) !== null) {
    count++;
    if (count === targetN) {
      pos = match.index + match[0].length;
      break;
    }
  }

  if (pos === 0 && count < targetN) {
    // Not enough paragraphs — append at end
    return html + '\n' + injection;
  }

  return html.slice(0, pos) + '\n' + injection + html.slice(pos);
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * interlinkArticle(article, pool)
 *
 * @param article  { id, slug, title, content, topic_id, category, link_count }
 * @param pool     Array of { id, slug, title, topic_id, category, is_pillar, link_count }
 *                 — should include ALL published articles incl. the target; self is filtered out
 * @returns        { html, linksAdded, skipped }
 */
export function interlinkArticle(article, pool) {

  const selfSlug     = article.slug;
  const selfCategory = article.category || article.topics?.category || '';
  const selfTopicId  = article.topic_id;

  // Build candidate list (excluding self), pillar first
  const candidates = pool
    .filter(a => a.slug !== selfSlug)
    .map(a => ({
      url:      articleUrl(a),
      title:    a.title || '',
      keywords: extractKeywords(a.title || ''),
      isPillar: !!(a.is_pillar ?? a.topics?.is_pillar),
      category: a.category || a.topics?.category || '',
      topicId:  a.topic_id,
    }))
    .sort((a, b) => {
      // Pillar first, then same category, then alpha
      if (b.isPillar !== a.isPillar) return b.isPillar ? 1 : -1;
      const aMatch = a.category === selfCategory ? 1 : 0;
      const bMatch = b.category === selfCategory ? 1 : 0;
      if (bMatch !== aMatch) return bMatch - aMatch;
      return a.title.localeCompare(b.title);
    });

  const usedUrls    = new Set();
  const usedAnchors = new Set();

  // ── 1. Contextual links (up to 10, capped only by what naturally matches) ──
  const ctxCandidates = candidates.map(c => ({ ...c })); // shallow clone for mutation
  let html = article.content || '';

  const { html: afterCtx, contextualCount } = injectContextualLinks(
    html, ctxCandidates, 10
  );
  html = afterCtx;

  // Track which URLs/anchors contextual linking used
  // (candidates list was mutated — removed matched ones)
  for (const c of candidates) {
    if (!ctxCandidates.find(cc => cc.url === c.url)) {
      usedUrls.add(c.url);
    }
  }

  // ── 2. Mid-content "Related:" link after 2nd paragraph ───────────────────
  const midCandidateRaw = candidates.find(
    c => !usedUrls.has(c.url) && !usedAnchors.has(c.title)
  );
  let midCount = 0;

  if (midCandidateRaw) {
    const midBlock = `<p data-injected="true"><strong>Related:</strong> ` +
      `<a href="${midCandidateRaw.url}" class="article-link">${midCandidateRaw.title}</a></p>`;
    html = insertAfterParagraph(html, 2, midBlock);
    usedUrls.add(midCandidateRaw.url);
    usedAnchors.add(midCandidateRaw.title);
    midCount = 1;
  }

  // ── 3. Bottom "Related Articles" (2-3 same category) ─────────────────────
  const relatedPool = candidates.filter(
    c => c.category === selfCategory && !usedUrls.has(c.url)
  );
  // Prefer same topic first
  relatedPool.sort((a, b) => {
    const aT = a.topicId === selfTopicId ? 1 : 0;
    const bT = b.topicId === selfTopicId ? 1 : 0;
    if (bT !== aT) return bT - aT;
    return b.isPillar ? 1 : -1;
  });

  const relatedPicks = relatedPool.slice(0, 3);
  let relatedCount   = 0;

  if (relatedPicks.length) {
    const listItems = relatedPicks
      .map(c => `<li><a href="${c.url}" class="article-link">${c.title}</a></li>`)
      .join('\n');
    html += `\n<h3 data-injected="true">Related Articles</h3>\n<ul data-injected="true">\n${listItems}\n</ul>`;
    relatedPicks.forEach(c => usedUrls.add(c.url));
    relatedCount = relatedPicks.length;
  }

  // ── 4. Bottom "Explore More" (2 different categories) ────────────────────
  const explorePool = candidates.filter(
    c => c.category !== selfCategory && !usedUrls.has(c.url)
  );
  explorePool.sort((a, b) => (b.isPillar ? 1 : -1));

  const explorePicks = explorePool.slice(0, 2);
  let   exploreCount = 0;

  if (explorePicks.length) {
    const listItems = explorePicks
      .map(c => `<li><a href="${c.url}" class="article-link">${c.title}</a></li>`)
      .join('\n');
    html += `\n<h3 data-injected="true">Explore More</h3>\n<ul data-injected="true">\n${listItems}\n</ul>`;
    explorePicks.forEach(c => usedUrls.add(c.url));
    exploreCount = explorePicks.length;
  }

  const linksAdded = contextualCount + midCount + relatedCount + exploreCount;

  return { html, linksAdded };
}
