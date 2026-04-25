/**
 * Smart Internal Linking Engine — Bible Verse Insights
 *
 * Rules (per spec):
 *  - No link count cap — add ALL naturally matching links
 *  - Contextual links injected throughout paragraphs (max 2 per paragraph block)
 *  - Pillar → Child linking: all child pages pushed strongly (intro + mid + bottom)
 *  - Mid-content "Related:" blocks after paragraph 1 AND paragraph 2
 *  - Bottom "Related Verses": child pages first, then pillar, then same category (up to 10)
 *  - Bottom "Explore More": 2-3 links from closely related/different categories
 *  - Category-level: 2-3 same category + 1-2 related category
 *  - Anchor text: 2-5 words, natural reading flow, no keyword stuffing
 *  - No duplicate URL or anchor text
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

/** Extract keyword candidates from a title, 2-5 words, longest first */
function extractKeywords(title) {
  const clean = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const result = new Set();

  // 5-grams
  for (let i = 0; i <= words.length - 5; i++) {
    const phrase = words.slice(i, i + 5).join(' ');
    if (!words.slice(i, i + 5).every(w => STOPWORDS.has(w))) result.add(phrase);
  }

  // 4-grams
  for (let i = 0; i <= words.length - 4; i++) {
    const phrase = words.slice(i, i + 4).join(' ');
    if (!words.slice(i, i + 4).every(w => STOPWORDS.has(w))) result.add(phrase);
  }

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

  // Significant single words (5+ chars)
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
 */
function tryLink(text, candidates, usedUrls, usedAnchors) {
  for (const cand of candidates) {
    if (usedUrls.has(cand.url)) continue;

    for (const kw of cand.keywords) {
      if (usedAnchors.has(kw)) continue;

      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re      = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i');
      const match   = re.exec(text);
      if (!match) continue;

      const anchor = match[0];
      const linked = text.slice(0, match.index)
        + `<a href="${cand.url}" class="article-link">${anchor}</a>`
        + text.slice(match.index + anchor.length);

      return { text: linked, matched: true, url: cand.url, anchor: kw };
    }
  }
  return { text, matched: false };
}

/**
 * Walk HTML tokens and inject contextual links throughout paragraphs.
 * Max 2 links per paragraph block. No overall cap — links everything that matches.
 */
function injectContextualLinks(html, candidates) {
  const usedUrls    = new Set();
  const usedAnchors = new Set();

  let inAnchor  = 0;
  let inHeading = 0;
  let inPara    = 0;
  let paraLinkCount = 0; // links within current paragraph

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
        if (closing) {
          inPara--;
          paraLinkCount = 0; // reset per-paragraph counter
        } else {
          inPara++;
        }
      }

      result.push(token.value);
      continue;
    }

    // Text node — inject link if in a paragraph, not inside anchor/heading, and para hasn't hit 2 links yet
    if (
      inPara > 0 &&
      inAnchor <= 0 &&
      inHeading <= 0 &&
      paraLinkCount < 2 &&
      candidates.length > 0
    ) {
      const { text, matched, url, anchor } = tryLink(
        token.value, candidates, usedUrls, usedAnchors
      );
      if (matched) {
        paraLinkCount++;
        usedUrls.add(url);
        usedAnchors.add(anchor);
        const idx = candidates.findIndex(c => c.url === url);
        if (idx !== -1) candidates.splice(idx, 1);
      }
      result.push(text);
    } else {
      result.push(token.value);
    }
  }

  return { html: result.join(''), usedUrls, usedAnchors };
}

/**
 * Insert HTML injection after the Nth closing </p> tag.
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
    return html + '\n' + injection;
  }

  return html.slice(0, pos) + '\n' + injection + html.slice(pos);
}

/**
 * Count </p> tags in an HTML string.
 */
function countParagraphs(html) {
  return (html.match(/<\/p>/gi) || []).length;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * interlinkArticle(article, pool)
 *
 * @param article  { id, slug, title, content, topic_id, category, link_count }
 * @param pool     Array of { id, slug, title, topic_id, category, is_pillar, link_count }
 * @returns        { html, linksAdded }
 */
export function interlinkArticle(article, pool) {

  const selfSlug     = article.slug;
  const selfCategory = article.category || article.topics?.category || '';
  const selfTopicId  = article.topic_id;

  // Build candidates — exclude self, pillar first, then same category, then alpha
  const allCandidates = pool
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
      if (b.isPillar !== a.isPillar) return b.isPillar ? 1 : -1;
      const aMatch = a.category === selfCategory ? 1 : 0;
      const bMatch = b.category === selfCategory ? 1 : 0;
      if (bMatch !== aMatch) return bMatch - aMatch;
      return a.title.localeCompare(b.title);
    });

  // ── 1. Contextual links — no cap, max 2 per paragraph ────────────────────
  const ctxCandidates = allCandidates.map(c => ({ ...c }));
  let html = article.content || '';

  const { html: afterCtx, usedUrls, usedAnchors } = injectContextualLinks(html, ctxCandidates);
  html = afterCtx;

  // Track which URLs were used contextually
  for (const c of allCandidates) {
    if (!ctxCandidates.find(cc => cc.url === c.url)) {
      usedUrls.add(c.url);
    }
  }

  const contextualCount = usedUrls.size;

  // ── 2. Mid-content "Related:" blocks — after paragraph 1 AND paragraph 2 ──
  // Pick two different unused candidates for the two mid-content blocks
  const midPool = allCandidates.filter(c => !usedUrls.has(c.url));
  let midCount  = 0;

  // After paragraph 1 — prefer same-category/same-topic
  const mid1 = midPool.find(c => c.category === selfCategory) || midPool[0];
  if (mid1 && countParagraphs(html) >= 1) {
    const block = `<p data-injected="true"><strong>Related:</strong> ` +
      `<a href="${mid1.url}" class="article-link">${mid1.title}</a></p>`;
    html = insertAfterParagraph(html, 1, block);
    usedUrls.add(mid1.url);
    midCount++;
  }

  // After paragraph 2 (now paragraph 3 because we inserted one above) — prefer pillar or same-topic
  const mid2 = allCandidates.find(c => !usedUrls.has(c.url) && (c.isPillar || c.topicId === selfTopicId))
            || allCandidates.find(c => !usedUrls.has(c.url));
  if (mid2 && countParagraphs(html) >= 3) {
    const block = `<p data-injected="true"><strong>Related:</strong> ` +
      `<a href="${mid2.url}" class="article-link">${mid2.title}</a></p>`;
    html = insertAfterParagraph(html, 3, block);
    usedUrls.add(mid2.url);
    midCount++;
  }

  // ── 3. Bottom "Related Verses" — child pages first, then pillar, then same category ──
  // Pick up to 10 links: same-topic child first, then pillar, then same-category, then any
  const relatedBottom = allCandidates
    .filter(c => !usedUrls.has(c.url))
    .sort((a, b) => {
      // same topic/child first
      const aChild = a.topicId === selfTopicId ? 3 : 0;
      const bChild = b.topicId === selfTopicId ? 3 : 0;
      if (bChild !== aChild) return bChild - aChild;
      // pillar next
      if (b.isPillar !== a.isPillar) return b.isPillar ? 1 : -1;
      // same category next
      const aCat = a.category === selfCategory ? 1 : 0;
      const bCat = b.category === selfCategory ? 1 : 0;
      if (bCat !== aCat) return bCat - aCat;
      return a.title.localeCompare(b.title);
    });

  const relatedPicks = relatedBottom.slice(0, 10);
  let relatedCount   = 0;

  if (relatedPicks.length) {
    const listItems = relatedPicks
      .map(c => `<li><a href="${c.url}" class="article-link">${c.title}</a></li>`)
      .join('\n');
    html += `\n<h3 data-injected="true">Related Verses</h3>\n<ul data-injected="true">\n${listItems}\n</ul>`;
    relatedPicks.forEach(c => usedUrls.add(c.url));
    relatedCount = relatedPicks.length;
  }

  // ── 4. Bottom "Explore More" — 2-3 from different/related categories ──────
  const explorePool = allCandidates
    .filter(c => c.category !== selfCategory && !usedUrls.has(c.url));
  explorePool.sort((a, b) => (b.isPillar ? 1 : -1));

  const explorePicks = explorePool.slice(0, 3);
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
