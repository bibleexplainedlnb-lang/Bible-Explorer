/**
 * Smart Internal Linking Engine — Bible Verse Insights
 *
 * Pillar / child topic-cluster strategy
 * ────────────────────────────────────────────────────────────────────────────
 *  • Identify the article's role in the cluster:
 *      - parent (its topic has child articles)         → emphasize child links
 *      - child  (its topic has a parent topic)         → link back to pillar +
 *                                                        2-3 sibling articles
 *  • Strict anchor rules (still enforced from the previous task):
 *      - NO single-word links, NO all-stopword phrases
 *      - Every phrase ≥ 2 content words, ideal 3-6 words
 *  • Three placement passes:
 *      1. INLINE phrase matching, in cluster-priority order
 *         (children first for parents; pillar+siblings first for children)
 *      2. MID-CONTENT inserts for unmatched cluster candidates
 *         (sentences distributed at paragraph midpoints, not appended at end)
 *      3. BOTTOM topic-cluster section
 *         (parents → "More in This Topic Cluster" listing children;
 *          children → "Related in This Cluster" listing pillar + siblings)
 *
 * Render-time markers
 * ────────────────────────────────────────────────────────────────────────────
 *  Inserted content uses class="cluster-insert" (paragraphs) and
 *  class="topic-cluster" (section), NOT the legacy data-injected="true"
 *  attribute. The latter is stripped by lib/articlePage.js sanitizeForDisplay
 *  to clean up old artifacts. The new markers survive that sanitizer and
 *  render to users. lib/seoEnrich.js stripArticleLinks knows about both
 *  marker schemes so re-linking is idempotent.
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

// Anchor-text rules
const MIN_WORDS         = 2;
const MAX_WORDS         = 6;
const IDEAL_MIN         = 3;
const IDEAL_MAX         = 6;
const MIN_CONTENT_WORDS = 2;
const MAX_ANCHOR_WORDS  = 8;          // anchors longer than this get truncated (sanitizer caps at 10)

// Cluster-section sizing
const MAX_INSERTS              = 3;   // mid-content insert sentences (pass 2)
const BOTTOM_CHILDREN_COUNT    = 6;   // pillar bottom section: child links
const BOTTOM_SIBLINGS_COUNT    = 3;   // child bottom section: sibling links
const SIBLING_CONSIDERATION_CAP = 30; // for inline pass when parent has 1000+ kids

// Contextual insertion (pass 2). MIN_PARAGRAPH_OVERLAP is the minimum number
// of meaningful keywords a paragraph must share with a candidate before we
// will insert a contextual sentence after that paragraph. If no paragraph in
// the body meets the threshold, the candidate is skipped — we never force.
const MIN_PARAGRAPH_OVERLAP = 1;
const MIN_PARAGRAPH_LENGTH  = 40;     // skip very short paragraphs (e.g. lone verse refs)

// Smaller stopword set for paragraph/candidate keyword overlap. Unlike
// STOPWORDS above this DOES NOT filter out topical bible vocabulary
// (love, faith, hope, grace, prayer, etc.) — those words are exactly what
// indicates contextual relevance between a paragraph and a candidate article.
const BASIC_STOPWORDS = new Set([
  'the','this','that','with','from','your','they','their','them','have','been',
  'were','will','would','should','could','what','when','where','which','while',
  'about','these','those','then','than','more','most','some','also','just','very',
  'such','many','much','here','there','only','even','same','into','upon','over',
  'under','through','because','still','again','being','make','makes','made',
  'made','take','takes','taken','give','gives','given','find','finds','found',
  'know','known','kept','keep','keeps','call','called','calls','tell','told',
  'tells','look','looks','looked','come','came','coming','goes','going','went',
  'said','says','say','like','want','wants','wanted','need','needs','needed',
  'each','every','both','either','neither','none','other','others','well','best',
  'good','better','great','small','little','first','last','next','still','always',
  'never','often','sometimes','perhaps','really','rather','quite','very','too',
  'true','truly','clearly','simply','actually',
]);

// Sentence templates by candidate category. The {LINK} placeholder is replaced
// with a properly-anchored hyperlink. Multiple templates per category prevent
// repetition when several inserts land on the same article — a deterministic
// hash of the candidate's slug picks one so re-linking stays idempotent.
const INSERT_TEMPLATES = {
  'bible-verses': [
    'Scripture explores this theme more fully in {LINK}.',
    'You can study related passages in {LINK}.',
    'The Bible offers further insight on this in {LINK}.',
  ],
  'topics': [
    'For a deeper look at this theme, see {LINK}.',
    'This connects closely with {LINK}.',
    'A fuller treatment of this idea appears in {LINK}.',
  ],
  'questions': [
    'A closely related question is addressed in {LINK}.',
    'For more on this question, read {LINK}.',
    'This naturally leads into the question covered in {LINK}.',
  ],
  'bible-characters': [
    'This same theme appears in the life of {LINK}.',
    'Consider how this is illustrated in the story of {LINK}.',
    'A biblical example of this is found in {LINK}.',
  ],
  'guides': [
    'For a step-by-step look at this, see the guide on {LINK}.',
    'A full practical guide is available in {LINK}.',
    'Read the complete guide on this in {LINK}.',
  ],
  'default': [
    'For deeper study, see {LINK}.',
    'Read more on this in {LINK}.',
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isContentWord(w) {
  return w.length >= 3 && !STOPWORDS.has(w);
}

function articleUrl(a) {
  const cat = a.category || '';
  if (cat === 'questions')         return `/questions/${a.slug}/`;
  if (cat === 'topics')            return `/topics/${a.slug}/`;
  if (cat === 'bible-verses')      return `/bible-verses/${a.slug}/`;
  if (cat === 'bible-characters')  return `/bible-characters/${a.slug}/`;
  return `/guides/${a.slug}/`;
}

function isValidPhrase(phrase) {
  const words = phrase.split(/\s+/).filter(Boolean);
  if (words.length < MIN_WORDS || words.length > MAX_WORDS) return false;
  return words.filter(isContentWord).length >= MIN_CONTENT_WORDS;
}

function scorePhrase(phrase, source) {
  const words   = phrase.split(/\s+/).filter(Boolean);
  const content = words.filter(isContentWord).length;
  let lenScore  = 0;
  if (words.length >= IDEAL_MIN && words.length <= IDEAL_MAX) lenScore = 10;
  else if (words.length === 2)                                lenScore = 4;
  return lenScore + content * 2 + (source === 'title' ? 2 : 0);
}

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

function buildPhrases(candidate) {
  const titleWords = (candidate.title || '')
    .toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/).filter(Boolean);
  const slugWords = (candidate.slug || '').split('-').filter(Boolean);

  const scored = new Map();
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

function buildPhraseRegex(phrase) {
  const words = phrase.split(/\s+/).filter(Boolean);
  const parts = words.map(w => `${escapeRegex(w)}(?:['\u2019]s?)?`);
  return new RegExp(`(?<![a-zA-Z])(${parts.join('\\s+')})(?![a-zA-Z])`, 'i');
}

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

// ─── Contextual mid-content insertion ────────────────────────────────────────

/**
 * Extract the keyword set from a chunk of paragraph text.
 *  - Strip HTML tags
 *  - Lowercase
 *  - Keep only alphabetic words ≥ 4 chars
 *  - Drop BASIC_STOPWORDS (but KEEP topical bible vocabulary like love, faith,
 *    grace, prayer — those words are the actual signal of relevance)
 */
function paragraphKeywords(text) {
  const cleaned = text.replace(/<[^>]+>/g, ' ').toLowerCase();
  const words = cleaned.match(/\b[a-z]{4,}\b/g) || [];
  return new Set(words.filter(w => !BASIC_STOPWORDS.has(w)));
}

/**
 * The candidate's themed keyword set, drawn from its title and slug.
 */
function candidateKeywords(c) {
  const titleWords = (c.title || '').toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const slugWords  = (c.slug  || '').split('-').filter(w => w.length >= 4);
  return new Set([...titleWords, ...slugWords].filter(w => !BASIC_STOPWORDS.has(w)));
}

/**
 * Tokenize the body's <p> blocks into analyzable paragraphs.
 * Skips very short paragraphs (e.g. lone verse references) which can't
 * meaningfully establish context.
 */
function analyzeContent(html) {
  const paras = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const inner = m[1];
    if (inner.replace(/<[^>]+>/g, '').trim().length < MIN_PARAGRAPH_LENGTH) continue;
    paras.push({
      start: m.index,
      end: m.index + m[0].length,
      keywords: paragraphKeywords(inner),
    });
  }
  return paras;
}

/**
 * Find the paragraph in `paragraphs` that best matches `candidate` by
 * keyword overlap. Skips paragraphs already used by a previous insert
 * so two contextual sentences don't pile up on the same paragraph.
 *
 * Returns { paragraph, overlap } if any paragraph meets MIN_PARAGRAPH_OVERLAP,
 * otherwise null — and a null result means we DO NOT INSERT this candidate.
 * That's the "don't force" guarantee.
 */
function bestParagraphForCandidate(paragraphs, candidate, usedPositions) {
  const cKeys = candidateKeywords(candidate);
  if (cKeys.size === 0) return null;
  let best = null;
  for (const p of paragraphs) {
    if (usedPositions.has(p.end)) continue;
    let overlap = 0;
    for (const k of cKeys) if (p.keywords.has(k)) overlap++;
    if (overlap < MIN_PARAGRAPH_OVERLAP) continue;
    if (!best || overlap > best.overlap) best = { paragraph: p, overlap };
  }
  return best;
}

/**
 * Truncate a candidate title for use as anchor text.
 * The articlePage.js sanitizer unwraps any anchor with > 10 words; we keep
 * a slightly tighter cap and try to break at a natural punctuation point.
 * Falls back to a humanized slug if the title is missing/empty so we never
 * render literal "undefined" in user-visible HTML.
 */
function safeAnchorTitle(candidate) {
  const titleStr = (candidate && typeof candidate.title === 'string') ? candidate.title.trim() : '';
  const fallback = (candidate && candidate.slug)
    ? candidate.slug.replace(/-/g, ' ').replace(/\b([a-z])/g, (_, c) => c.toUpperCase())
    : 'this article';
  const title = titleStr || fallback;
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length <= MAX_ANCHOR_WORDS) return title;
  const m = title.match(/^([^,:;]+)[,:;]/);
  if (m && m[1].split(/\s+/).filter(Boolean).length <= MAX_ANCHOR_WORDS) return m[1].trim();
  return words.slice(0, MAX_ANCHOR_WORDS).join(' ');
}

/**
 * Deterministic non-cryptographic string hash — used to pick a template
 * variant per candidate so re-links produce stable output.
 */
function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildContextualInsert(candidate) {
  const templates = INSERT_TEMPLATES[candidate.category] || INSERT_TEMPLATES.default;
  const tpl       = templates[simpleHash(candidate.slug || candidate.id || '') % templates.length];
  const url       = escapeHtml(candidate.url || articleUrl(candidate));
  const anchor    = `<a href="${url}" class="article-link" style="color:#1a56db;text-decoration:underline">${escapeHtml(safeAnchorTitle(candidate))}</a>`;
  const sentence  = tpl.replace('{LINK}', anchor);
  return `<p class="cluster-insert" style="margin:1.25rem 0;padding:0.6rem 0.9rem;background:#faf7ee;border-left:3px solid #b8860b;border-radius:0 0.4rem 0.4rem 0;font-style:italic;color:#3a2e1a">${sentence}</p>`;
}

// ─── Bottom cluster section ─────────────────────────────────────────────────

function buildClusterListBlock(heading, items, usedUrls) {
  if (items.length === 0) return '';
  const lis = items.map(item => {
    const url = articleUrl(item);
    usedUrls.add(url);
    return `<li style="padding:0.4rem 0;border-bottom:1px solid #f0ebe0"><a href="${url}" class="article-link" style="color:#1a56db;text-decoration:none;font-family:Georgia,serif">→ ${escapeHtml(item.title)}</a></li>`;
  }).join('');
  return `<h3 style="margin-top:0;font-family:Georgia,serif;font-size:1rem;color:#1e2d4a;border-top:none;padding-top:0">${escapeHtml(heading)}</h3><ul style="list-style:none;padding:0;margin:0 0 1rem 0">${lis}</ul>`;
}

/**
 * Build the bottom "topic cluster" navigation section.
 *
 * - For PARENT articles (their topic has child articles):
 *     "More in This Topic Cluster" listing up to BOTTOM_CHILDREN_COUNT children
 *
 * - For CHILD articles (their topic has a pillar parent):
 *     "Related in This Cluster" listing the pillar mate (if any) + up to
 *     BOTTOM_SIBLINGS_COUNT siblings
 *
 * Articles already linked inline or via mid-content insert are skipped to
 * avoid duplicate URLs. Heading text is intentionally NOT one of the legacy
 * phrases ("Related Articles", "Explore More", etc) so it survives the
 * articlePage.js sanitizer.
 */
function buildBottomSection({ isParent, hasParent, children, pillarMates, siblings, usedUrls }) {
  const blocks = [];
  let added = 0;

  if (isParent && children.length > 0) {
    const items = children
      .filter(c => !usedUrls.has(articleUrl(c)))
      .slice(0, BOTTOM_CHILDREN_COUNT);
    const block = buildClusterListBlock('More in This Topic Cluster', items, usedUrls);
    if (block) { blocks.push(block); added += items.length; }
  }

  if (hasParent) {
    const pillarItems = pillarMates
      .filter(p => !usedUrls.has(articleUrl(p)))
      .slice(0, 1);
    const sibItems = siblings
      .filter(s => !usedUrls.has(articleUrl(s)))
      .slice(0, BOTTOM_SIBLINGS_COUNT);
    const headerItems = [...pillarItems, ...sibItems];
    const block = buildClusterListBlock('Related in This Cluster', headerItems, usedUrls);
    if (block) { blocks.push(block); added += headerItems.length; }
  }

  if (blocks.length === 0) return { html: '', added: 0 };
  return {
    html: `<section class="topic-cluster" style="margin-top:2rem;padding:1.25rem 1.5rem;background:#faf7ee;border:1px solid #e8dfc8;border-radius:0.75rem">${blocks.join('')}</section>`,
    added,
  };
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
  // Self lookup — also recover is_pillar / parent_topic_id from the pool entry.
  const selfId           = article.id;
  const selfFromPool     = pool.find(p => p.id === selfId) || {};
  const selfTopic        = article.topic_id    || selfFromPool.topic_id        || null;
  const selfParentTopic  = article.parentTopicId || article.parent_topic_id
                          || selfFromPool.parent_topic_id || null;
  const selfCategory     = article.category    || selfFromPool.category        || '';

  // De-facto pillar definition: any topic that is referenced as some other
  // article's parent_topic_id (the project's `topics.is_pillar` boolean is
  // currently unused). If a topic has child articles, it's a pillar.
  const pillarTopicIds = new Set();
  for (const a of pool) if (a.parent_topic_id) pillarTopicIds.add(a.parent_topic_id);

  const isParent  = !!(selfTopic && pillarTopicIds.has(selfTopic));
  const hasParent = !!selfParentTopic;

  // ── Tier the candidates ──────────────────────────────────────────────────
  const childArticles = []; // articles whose topic.parent_id === my topic_id
  const pillarMates   = []; // articles whose topic_id === my parent_topic_id
  const siblings      = []; // articles sharing my parent_topic_id (or topic_id)
  const cousins       = []; // same category, unrelated cluster
  const others        = [];

  for (const a of pool) {
    if (!a.title || !a.slug) continue;
    if (a.id === selfId || a.slug === article.slug) continue;

    if (isParent && a.parent_topic_id === selfTopic) {
      childArticles.push(a);
    } else if (hasParent && a.topic_id === selfParentTopic) {
      pillarMates.push(a);
    } else if (hasParent && a.parent_topic_id === selfParentTopic) {
      siblings.push(a);
    } else if (a.topic_id === selfTopic) {
      siblings.push(a); // articles sharing the same exact topic
    } else if (a.category === selfCategory) {
      cousins.push(a);
    } else {
      others.push(a);
    }
  }

  // Score within each tier (existing relevance + cluster bonuses)
  const scoreOf = c => {
    let s = 1;
    if (c.topic_id && c.topic_id === selfTopic)                          s = 10;
    else if (selfParentTopic && c.parent_topic_id === selfParentTopic)   s = 6;
    else if (selfParentTopic && c.topic_id === selfParentTopic)          s = 5;
    else if (c.category === selfCategory)                                s = 3;
    if (c.is_pillar) s += 0.5;
    if (isParent  && c.parent_topic_id === selfTopic)        s += 25; // child of self
    if (hasParent && c.topic_id === selfParentTopic)         s += 20; // pillar mate
    return s;
  };
  const sortTier = arr => arr
    .map(c => ({ c, s: scoreOf(c) }))
    .sort((a, b) => b.s - a.s || a.c.title.localeCompare(b.c.title))
    .map(x => x.c);

  const sortedChildren = sortTier(childArticles);
  const sortedPillar   = sortTier(pillarMates);
  const sortedSiblings = sortTier(siblings).slice(0, SIBLING_CONSIDERATION_CAP);
  const sortedCousins  = sortTier(cousins);
  const sortedOthers   = sortTier(others);

  // Inline candidate ordering: children → pillar mate → siblings → cousins → rest.
  // For pillar pages this guarantees children are tried first, naturally
  // producing the >70% child-link ratio the strategy targets.
  const orderedCandidates = [
    ...sortedChildren,
    ...sortedPillar,
    ...sortedSiblings,
    ...sortedCousins,
    ...sortedOthers,
  ].map(c => ({ ...c, url: articleUrl(c) }));

  let html = article.content || '';
  const usedUrls = new Set();

  // ── PASS 1: inline phrase matching (cluster-prioritized order) ───────────
  const unmatchedClusterPriority = [];
  for (const candidate of orderedCandidates) {
    if (usedUrls.has(candidate.url)) continue;
    const phrases = buildPhrases(candidate);
    if (phrases.length === 0) continue;

    let matched = false;
    for (const phrase of phrases) {
      const { html: newHtml, replaced } = replaceFirstPhrase(html, phrase, candidate.url);
      if (replaced) {
        html = newHtml;
        usedUrls.add(candidate.url);
        matched = true;
        break;
      }
    }
    if (!matched) {
      const isClusterPriority =
        (isParent  && candidate.parent_topic_id === selfTopic) ||
        (hasParent && candidate.topic_id        === selfParentTopic);
      if (isClusterPriority) unmatchedClusterPriority.push({ candidate, phrases });
    }
  }

  // ── PASS 2: contextual mid-content inserts ───────────────────────────────
  // Each unmatched cluster candidate is placed AFTER the body paragraph that
  // shares the most meaningful keywords with it. If no paragraph shares at
  // least MIN_PARAGRAPH_OVERLAP keyword with the candidate, the candidate is
  // skipped — we never force a sentence that has nothing to do with the
  // surrounding content. Sentence wording rotates through category-specific
  // templates (deterministic by slug hash) so re-links stay idempotent.
  const paragraphs    = analyzeContent(html);
  const usedPositions = new Set();
  const insertions    = [];
  for (const { candidate } of unmatchedClusterPriority) {
    if (insertions.length >= MAX_INSERTS) break;
    if (usedUrls.has(candidate.url)) continue;
    const fit = bestParagraphForCandidate(paragraphs, candidate, usedPositions);
    if (!fit) continue;                    // no contextual home → don't force
    usedPositions.add(fit.paragraph.end);
    insertions.push({
      position: fit.paragraph.end,
      content:  buildContextualInsert(candidate),
    });
    usedUrls.add(candidate.url);
  }
  // Apply in reverse position order so earlier positions stay valid
  insertions.sort((a, b) => b.position - a.position);
  for (const { position, content } of insertions) {
    html = html.slice(0, position) + content + html.slice(position);
  }

  // ── PASS 3: bottom topic-cluster section ─────────────────────────────────
  const bottom = buildBottomSection({
    isParent, hasParent,
    children:    sortedChildren,
    pillarMates: sortedPillar,
    siblings:    sortedSiblings,
    usedUrls,
  });
  html += bottom.html;

  return { html, linksAdded: usedUrls.size };
}
