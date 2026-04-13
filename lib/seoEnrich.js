/**
 * SEO Enrichment Engine — Bible Verse Insights
 *
 * Applied after AI generation to inject:
 *  1. Bible verse blockquotes (detect inline citations or leave existing blockquotes)
 *  2. Inline keyword links (max 5, no repeats)
 *  3. "Know more" contextual block after 1st/2nd paragraph
 *  4. Related Articles section (same category, published)
 *  5. Read More section (2 same + 1 different category)
 *
 * enrichContent() returns { html, usedSlugs }
 */

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

const VARIATION_LIST = Object.entries(KEYWORD_GROUPS)
  .flatMap(([groupName, variations]) => variations.map(v => ({ groupName, variation: v })))
  .sort((a, b) => b.variation.length - a.variation.length);

// Detect inline Bible verse citations: "verse text" (Book Chapter:Verse)
// Matches straight and curly quotes, handles ranges like 3:16-17
const VERSE_CITATION_RE = /["""]([^"""]{10,200})["""]\s*\(([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)? \d+:\d+(?:[–\-]\d+)?)\)/g;

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
  return { text: `${before}<a href="${href}">${original}</a>${after}`, replaced: true };
}

/**
 * If the AI didn't already use <blockquote> tags, detect inline citations and wrap them.
 * Pattern: "verse text" (Book Chapter:Verse)  — converts to <blockquote>
 * Runs on text nodes only, skips content already inside <blockquote> or <a>.
 */
export function injectBibleVerses(html) {
  if (!html) return html;

  // If AI already formatted blockquotes, leave them
  if (/<blockquote/i.test(html)) return html;

  let skipDepth = 0;
  const tokens  = tokenize(html);
  const result  = tokens.map(token => {
    if (token.type === 'tag') {
      if (/^<(blockquote|a)[\s>]/i.test(token.value))  skipDepth++;
      if (/^<\/(blockquote|a)>/i.test(token.value))    skipDepth = Math.max(0, skipDepth - 1);
      return token.value;
    }
    if (skipDepth > 0) return token.value;
    return token.value.replace(VERSE_CITATION_RE, (_, verse, ref) =>
      `<blockquote>"${verse}" (${ref})</blockquote>`
    );
  }).join('');

  return result;
}

export function injectInlineLinks(html, publishedArticles) {
  if (!html || !publishedArticles?.length) return { html, usedSlugs: new Set() };

  const MAX_LINKS = 5;
  let linksAdded   = 0;
  const usedSlugs  = new Set();
  const usedGroups = new Set();

  const groupToArticle = {};
  for (const groupName of Object.keys(KEYWORD_GROUPS)) {
    const article = findArticleForGroup(groupName, publishedArticles);
    if (article) groupToArticle[groupName] = article;
  }

  const tokens = tokenize(html);
  let insideAnchor = 0;

  const resultHtml = tokens.map(token => {
    if (token.type === 'tag') {
      if (/^<a[\s>]/i.test(token.value))   insideAnchor++;
      if (/^<\/a>/i.test(token.value))     insideAnchor = Math.max(0, insideAnchor - 1);
      return token.value;
    }

    if (insideAnchor > 0 || linksAdded >= MAX_LINKS) return token.value;

    let text = token.value;

    for (const { groupName, variation } of VARIATION_LIST) {
      if (linksAdded >= MAX_LINKS) break;
      if (usedGroups.has(groupName)) continue;
      const article = groupToArticle[groupName];
      if (!article || usedSlugs.has(article.slug)) continue;

      const { text: newText, replaced } = replaceFirstVariation(text, variation, `/bible-verses/${article.slug}`);
      if (replaced) {
        text = newText;
        usedGroups.add(groupName);
        usedSlugs.add(article.slug);
        linksAdded++;
      }
    }

    return text;
  }).join('');

  return { html: resultHtml, usedSlugs };
}

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

  const block = `<p><strong>Know more:</strong> <a href="/bible-verses/${candidate.slug}">${candidate.title}</a></p>`;

  const result = paragraphs.map((part, i) => {
    const isLast    = i === paragraphs.length - 1;
    const withClose = isLast ? part : part + '</p>';
    if (i === insertAfterIdx && !isLast) return withClose + block;
    return withClose;
  }).join('');

  return { html: result, usedSlug: candidate.slug };
}

export function injectRelatedArticles(html, publishedArticles, category, currentSlug, excludeSlugs = new Set()) {
  const pool = publishedArticles.filter(a =>
    a.slug !== currentSlug && !excludeSlugs.has(a.slug) && a.category === category
  );
  if (pool.length === 0) return { html, usedSlugs: new Set() };

  const shuffled  = [...pool].sort(() => Math.random() - 0.5);
  const picked    = shuffled.slice(0, Math.min(3, shuffled.length));
  const usedSlugs = new Set(picked.map(a => a.slug));

  const items = picked.map(a => `  <li><a href="/bible-verses/${a.slug}">${a.title}</a></li>`).join('\n');
  const block = `\n<h3>Related Articles</h3>\n<ul>\n${items}\n</ul>`;

  return { html: html + block, usedSlugs };
}

export function injectReadMore(html, publishedArticles, category, excludeSlugs = new Set()) {
  const sameCat = publishedArticles
    .filter(a => !excludeSlugs.has(a.slug) && a.category === category)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const diffCat = publishedArticles
    .filter(a => !excludeSlugs.has(a.slug) && a.category !== category)
    .sort(() => Math.random() - 0.5)
    .slice(0, 1);

  const picked = [...sameCat, ...diffCat];
  if (picked.length === 0) return html;

  const items = picked.map(a => `  <li><a href="/bible-verses/${a.slug}">${a.title}</a></li>`).join('\n');
  const block = `\n<h3>Read More</h3>\n<ul>\n${items}\n</ul>`;

  return html + block;
}

/**
 * Full enrichment pipeline.
 *
 * Order:
 *  1. Bible verse blockquotes
 *  2. Inline keyword links
 *  3. Know More block
 *  4. Related Articles
 *  5. Read More
 *
 * Returns { html, usedSlugs } — usedSlugs is the complete set of all article
 * slugs referenced anywhere in the enriched output.
 */
export function enrichContent(html, publishedArticles, category, currentSlug) {
  if (!html) return { html, usedSlugs: new Set() };

  const allExcluded = new Set([currentSlug].filter(Boolean));

  // 1. Bible verse blockquotes
  let result = injectBibleVerses(html);

  // 2. Inline links
  const { html: linkedHtml, usedSlugs: inlineSlugs } = injectInlineLinks(result, publishedArticles || []);
  result = linkedHtml;
  for (const s of inlineSlugs) allExcluded.add(s);

  if (!publishedArticles?.length) return { html: result, usedSlugs: allExcluded };

  // 3. Know More
  const { html: withKnowMore, usedSlug: kmSlug } = injectKnowMore(result, publishedArticles, category, currentSlug, allExcluded);
  result = withKnowMore;
  if (kmSlug) allExcluded.add(kmSlug);

  // 4. Related Articles
  const { html: withRelated, usedSlugs: relatedSlugs } = injectRelatedArticles(result, publishedArticles, category, currentSlug, allExcluded);
  result = withRelated;
  for (const s of relatedSlugs) allExcluded.add(s);

  // 5. Read More
  result = injectReadMore(result, publishedArticles, category, allExcluded);

  return { html: result, usedSlugs: allExcluded };
}
