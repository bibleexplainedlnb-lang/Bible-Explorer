import Link from "next/link";

const BOOKS: { name: string; slug: string }[] = [
  { name: "Song of Solomon", slug: "song-of-solomon" },
  { name: "1 Thessalonians", slug: "1-thessalonians" },
  { name: "2 Thessalonians", slug: "2-thessalonians" },
  { name: "1 Corinthians",   slug: "1-corinthians" },
  { name: "2 Corinthians",   slug: "2-corinthians" },
  { name: "1 Chronicles",    slug: "1-chronicles" },
  { name: "2 Chronicles",    slug: "2-chronicles" },
  { name: "Lamentations",    slug: "lamentations" },
  { name: "Deuteronomy",     slug: "deuteronomy" },
  { name: "Ecclesiastes",    slug: "ecclesiastes" },
  { name: "Philippians",     slug: "philippians" },
  { name: "Revelation",      slug: "revelation" },
  { name: "Habakkuk",        slug: "habakkuk" },
  { name: "Zephaniah",       slug: "zephaniah" },
  { name: "Colossians",      slug: "colossians" },
  { name: "Galatians",       slug: "galatians" },
  { name: "Ephesians",       slug: "ephesians" },
  { name: "Nehemiah",        slug: "nehemiah" },
  { name: "Zechariah",       slug: "zechariah" },
  { name: "1 Timothy",       slug: "1-timothy" },
  { name: "2 Timothy",       slug: "2-timothy" },
  { name: "1 Samuel",        slug: "1-samuel" },
  { name: "2 Samuel",        slug: "2-samuel" },
  { name: "1 Kings",         slug: "1-kings" },
  { name: "2 Kings",         slug: "2-kings" },
  { name: "1 Peter",         slug: "1-peter" },
  { name: "2 Peter",         slug: "2-peter" },
  { name: "1 John",          slug: "1-john" },
  { name: "2 John",          slug: "2-john" },
  { name: "3 John",          slug: "3-john" },
  { name: "Leviticus",       slug: "leviticus" },
  { name: "Proverbs",        slug: "proverbs" },
  { name: "Obadiah",         slug: "obadiah" },
  { name: "Hebrews",         slug: "hebrews" },
  { name: "Philemon",        slug: "philemon" },
  { name: "Matthew",         slug: "matthew" },
  { name: "Malachi",         slug: "malachi" },
  { name: "Haggai",          slug: "haggai" },
  { name: "Genesis",         slug: "genesis" },
  { name: "Numbers",         slug: "numbers" },
  { name: "Joshua",          slug: "joshua" },
  { name: "Judges",          slug: "judges" },
  { name: "Psalms",          slug: "psalms" },
  { name: "Psalm",           slug: "psalms" },
  { name: "Isaiah",          slug: "isaiah" },
  { name: "Ezekiel",         slug: "ezekiel" },
  { name: "Ezra",            slug: "ezra" },
  { name: "Daniel",          slug: "daniel" },
  { name: "Hosea",           slug: "hosea" },
  { name: "Nahum",           slug: "nahum" },
  { name: "Micah",           slug: "micah" },
  { name: "Jonah",           slug: "jonah" },
  { name: "Titus",           slug: "titus" },
  { name: "James",           slug: "james" },
  { name: "Esther",          slug: "esther" },
  { name: "Romans",          slug: "romans" },
  { name: "Exodus",          slug: "exodus" },
  { name: "Amos",            slug: "amos" },
  { name: "Joel",            slug: "joel" },
  { name: "Jude",            slug: "jude" },
  { name: "Ruth",            slug: "ruth" },
  { name: "Acts",            slug: "acts" },
  { name: "Mark",            slug: "mark" },
  { name: "Luke",            slug: "luke" },
  { name: "John",            slug: "john" },
  { name: "Job",             slug: "job" },
];

const escapedNames = BOOKS.map(({ name }) =>
  name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
);

export const REFERENCE_RE = new RegExp(
  `(${escapedNames.join("|")})\\s+(\\d+)(?::(\\d+)(?:-\\d+)?)?`,
  "g"
);

export function bookSlug(name: string): string {
  return BOOKS.find(
    (b) => b.name.toLowerCase() === name.toLowerCase()
  )?.slug ?? name.toLowerCase().replace(/\s+/g, "-");
}

export function buildBibleHref(book: string, chapter: string, verse?: string): string {
  const slug = bookSlug(book);
  return verse
    ? `/bible/${slug}/${chapter}/${verse}`
    : `/bible/${slug}/${chapter}`;
}

// Single source of truth for Bible link styling
export const BIBLE_LINK_CLASS =
  "text-amber-700 bg-amber-50 underline underline-offset-2 decoration-amber-400 rounded-sm px-0.5 font-medium hover:text-amber-900 hover:bg-amber-100 transition-colors";

export function parseBibleReferences(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  REFERENCE_RE.lastIndex = 0;

  for (const match of text.matchAll(REFERENCE_RE)) {
    const [fullMatch, bookName, chapter, verse] = match;
    const start = match.index ?? 0;

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    parts.push(
      <Link
        key={start}
        href={buildBibleHref(bookName, chapter, verse)}
        className={BIBLE_LINK_CLASS}
      >
        {fullMatch}
      </Link>
    );

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Run a text replacer on all text nodes in an HTML string,
 * skipping text that is already inside an <a> tag.
 * Also skips the content of HTML tag attributes.
 */
export function processTextNodes(
  html: string,
  replacer: (text: string) => string
): string {
  const segments = html.split(/(<[^>]*>)/);
  let anchorDepth = 0;
  return segments
    .map((seg, i) => {
      if (i % 2 === 1) {
        // HTML tag
        if (/^<a[\s>]/i.test(seg)) anchorDepth++;
        else if (/^<\/a\s*>/i.test(seg)) anchorDepth = Math.max(0, anchorDepth - 1);
        return seg;
      }
      // Text node — skip if inside an anchor
      return anchorDepth > 0 ? seg : replacer(seg);
    })
    .join("");
}

/**
 * Linkify Bible references in an HTML string at render time.
 * Anchor-aware: never processes text already inside an <a> tag,
 * so it is safe to call on content that was already enriched at save time.
 */
export function linkifyHtml(html: string): string {
  const re = new RegExp(REFERENCE_RE.source, "g");
  return processTextNodes(html, (text) =>
    text.replace(re, (match, book, chapter, verse) => {
      const href = buildBibleHref(book, chapter, verse);
      return `<a href="${href}" class="${BIBLE_LINK_CLASS}">${match}</a>`;
    })
  );
}
