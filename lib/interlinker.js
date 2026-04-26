/**
 * Smart Internal Linking Engine — Bible Verse Insights
 *
 * Strategy:
 *  - NO random keyword injection into paragraphs (eliminates random links)
 *  - Mid-content: "See also" callout blocks placed after paragraph 3, 6, 9
 *    (highly relevant — picks the highest-scoring unused article)
 *  - Bottom "Related Articles": same topic family (same topic or same parent topic), min 3
 *  - Bottom "Read More": same category, different topic family, min 3
 *  - Bottom "Explore More": different category, min 3
 *  - All links: inline style="color:#1a56db;text-decoration:underline"
 *  - Hierarchy priority: sameTopic(10) > sameParentTopic(6) > parentTopic(5) > sameCategory(3)
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
  'mean','means','life','live','lives','people','person','true','truth',
]);

// ─── Helpers ────────────────────────────────────────────────────────────────

function articleUrl(article) {
  return `/${article.category}/${article.slug}/`;
}

/**
 * Insert HTML after the Nth closing </p> tag.
 * If the article doesn't have that many paragraphs, appends to the end.
 */
function insertAfterParagraph(html, targetN, injection) {
  let count = 0;
  let pos   = -1;
  const closeTag = /<\/p>/gi;
  let match;

  while ((match = closeTag.exec(html)) !== null) {
    count++;
    if (count === targetN) {
      pos = match.index + match[0].length;
      break;
    }
  }

  if (pos === -1) return html + '\n' + injection;
  return html.slice(0, pos) + '\n' + injection + html.slice(pos);
}

function countParagraphs(html) {
  return (html.match(/<\/p>/gi) || []).length;
}

/**
 * Score how relevant an article is to a section heading by word overlap.
 * Returns a number >= 0.
 */
function headingRelevance(headingText, candidateTitle) {
  const hWords = new Set(
    headingText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
      .filter(w => !STOPWORDS.has(w) && w.length >= 4)
  );
  if (hWords.size === 0) return 0;
  const cWords = candidateTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
    .filter(w => !STOPWORDS.has(w) && w.length >= 4);

  let overlap = 0;
  for (const w of cWords) {
    if (hWords.has(w)) overlap++;
  }
  return overlap;
}

/**
 * Build a styled "See also" mid-content block.
 */
function buildSeeAlso(article) {
  return `<p data-injected="true" style="margin:1.25rem 0;padding:0.75rem 1rem;background:#f5f0e8;border-left:3px solid #d4a017;border-radius:0.25rem;font-size:0.92rem">` +
    `<strong>See also:</strong> ` +
    `<a href="${article.url}" class="article-link" style="color:#1a56db;text-decoration:underline">${article.title}</a>` +
    `</p>`;
}

/**
 * Build a bottom section with heading + link list.
 */
function buildSection(heading, articles) {
  if (!articles.length) return '';
  const items = articles
    .map(a => `  <li style="margin-bottom:0.5rem"><a href="${a.url}" class="article-link" style="color:#1a56db;text-decoration:underline">${a.title}</a></li>`)
    .join('\n');
  return (
    `\n<h3 data-injected="true" style="font-family:Georgia,serif;font-size:1.05rem;color:#1e2d4a;margin:1.5rem 0 0.75rem;padding-top:1.5rem;border-top:1px solid #e8dfc8">${heading}</h3>` +
    `\n<ul data-injected="true" style="list-style:none;padding:0;margin:0 0 1rem">\n${items}\n</ul>`
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

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

  const usedUrls = new Set();

  // ── Build scored candidate list ────────────────────────────────────────────
  const candidates = pool
    .filter(a => a.slug !== selfSlug && a.title)
    .map(a => {
      const cat     = a.category || '';
      const topicId = a.topic_id || null;
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

  // Helper: pick n unused candidates matching an optional filter
  function pickUnused(n, filter = () => true) {
    const picks = [];
    for (const c of candidates) {
      if (picks.length >= n) break;
      if (!usedUrls.has(c.url) && filter(c)) picks.push(c);
    }
    return picks;
  }

  function markUsed(picks) { picks.forEach(p => usedUrls.add(p.url)); }

  let html = article.content || '';
  const totalParas = countParagraphs(html);

  // ── Phase 1: Mid-content "See also" blocks ─────────────────────────────────
  // Insert after paragraph 3 and paragraph 6 (skip if article is too short)
  // Pick articles that are most relevant to the article's overall topic (highest score)
  let midCount = 0;
  const midSlots = [3, 6].filter(n => n < totalParas);

  for (const slot of midSlots) {
    const pick = pickUnused(1)[0];
    if (!pick) break;
    html = insertAfterParagraph(html, slot + midCount, buildSeeAlso(pick));
    usedUrls.add(pick.url);
    midCount++;
  }

  // ── Phase 2: Related Articles (same topic family, min 3) ──────────────────
  const isSameFamily = (c) =>
    c.topicId === selfTopicId ||
    (selfParentId && (c.parId === selfParentId || c.topicId === selfParentId));

  let relatedPicks = pickUnused(8, isSameFamily);
  // Supplement to reach 3 from same category if needed
  if (relatedPicks.length < 3) {
    const extra = pickUnused(3 - relatedPicks.length, c =>
      c.category === selfCat && !relatedPicks.some(r => r.url === c.url)
    );
    relatedPicks = [...relatedPicks, ...extra];
  }
  // Last resort: any article to hit 3
  if (relatedPicks.length < 3) {
    const extra = pickUnused(3 - relatedPicks.length);
    relatedPicks = [...relatedPicks, ...extra];
  }
  markUsed(relatedPicks);

  // ── Phase 3: Read More (same category, not already used, min 3) ───────────
  let readMorePicks = pickUnused(6, c => c.category === selfCat);
  if (readMorePicks.length < 3) {
    const extra = pickUnused(3 - readMorePicks.length);
    readMorePicks = [...readMorePicks, ...extra];
  }
  markUsed(readMorePicks);

  // ── Phase 4: Explore More (different category, min 3) ────────────────────
  let explorePicks = pickUnused(4, c => c.category !== selfCat);
  if (explorePicks.length < 3) {
    const extra = pickUnused(3 - explorePicks.length);
    explorePicks = [...explorePicks, ...extra];
  }
  markUsed(explorePicks);

  // ── Build bottom HTML ─────────────────────────────────────────────────────
  const bottomHtml =
    buildSection('Related Articles', relatedPicks) +
    buildSection('Read More', readMorePicks) +
    buildSection('Explore More', explorePicks);

  if (bottomHtml.trim()) html += bottomHtml;

  const linksAdded = midCount + relatedPicks.length + readMorePicks.length + explorePicks.length;
  return { html, linksAdded };
}
