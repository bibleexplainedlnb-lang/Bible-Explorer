"use client";

import { useState, useRef, FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

/* ── KJV canon ── */
const BOOKS = [
  { name: "Genesis",          slug: "genesis",           chapters: 50  },
  { name: "Exodus",           slug: "exodus",            chapters: 40  },
  { name: "Leviticus",        slug: "leviticus",         chapters: 27  },
  { name: "Numbers",          slug: "numbers",           chapters: 36  },
  { name: "Deuteronomy",      slug: "deuteronomy",       chapters: 34  },
  { name: "Joshua",           slug: "joshua",            chapters: 24  },
  { name: "Judges",           slug: "judges",            chapters: 21  },
  { name: "Ruth",             slug: "ruth",              chapters: 4   },
  { name: "1 Samuel",         slug: "1-samuel",          chapters: 31  },
  { name: "2 Samuel",         slug: "2-samuel",          chapters: 24  },
  { name: "1 Kings",          slug: "1-kings",           chapters: 22  },
  { name: "2 Kings",          slug: "2-kings",           chapters: 25  },
  { name: "1 Chronicles",     slug: "1-chronicles",      chapters: 29  },
  { name: "2 Chronicles",     slug: "2-chronicles",      chapters: 36  },
  { name: "Ezra",             slug: "ezra",              chapters: 10  },
  { name: "Nehemiah",         slug: "nehemiah",          chapters: 13  },
  { name: "Esther",           slug: "esther",            chapters: 10  },
  { name: "Job",              slug: "job",               chapters: 42  },
  { name: "Psalms",           slug: "psalms",            chapters: 150 },
  { name: "Proverbs",         slug: "proverbs",          chapters: 31  },
  { name: "Ecclesiastes",     slug: "ecclesiastes",      chapters: 12  },
  { name: "Song of Solomon",  slug: "song-of-solomon",   chapters: 8   },
  { name: "Isaiah",           slug: "isaiah",            chapters: 66  },
  { name: "Jeremiah",         slug: "jeremiah",          chapters: 52  },
  { name: "Lamentations",     slug: "lamentations",      chapters: 5   },
  { name: "Ezekiel",          slug: "ezekiel",           chapters: 48  },
  { name: "Daniel",           slug: "daniel",            chapters: 12  },
  { name: "Hosea",            slug: "hosea",             chapters: 14  },
  { name: "Joel",             slug: "joel",              chapters: 3   },
  { name: "Amos",             slug: "amos",              chapters: 9   },
  { name: "Obadiah",          slug: "obadiah",           chapters: 1   },
  { name: "Jonah",            slug: "jonah",             chapters: 4   },
  { name: "Micah",            slug: "micah",             chapters: 7   },
  { name: "Nahum",            slug: "nahum",             chapters: 3   },
  { name: "Habakkuk",         slug: "habakkuk",          chapters: 3   },
  { name: "Zephaniah",        slug: "zephaniah",         chapters: 3   },
  { name: "Haggai",           slug: "haggai",            chapters: 2   },
  { name: "Zechariah",        slug: "zechariah",         chapters: 14  },
  { name: "Malachi",          slug: "malachi",           chapters: 4   },
  { name: "Matthew",          slug: "matthew",           chapters: 28  },
  { name: "Mark",             slug: "mark",              chapters: 16  },
  { name: "Luke",             slug: "luke",              chapters: 24  },
  { name: "John",             slug: "john",              chapters: 21  },
  { name: "Acts",             slug: "acts",              chapters: 28  },
  { name: "Romans",           slug: "romans",            chapters: 16  },
  { name: "1 Corinthians",    slug: "1-corinthians",     chapters: 16  },
  { name: "2 Corinthians",    slug: "2-corinthians",     chapters: 13  },
  { name: "Galatians",        slug: "galatians",         chapters: 6   },
  { name: "Ephesians",        slug: "ephesians",         chapters: 6   },
  { name: "Philippians",      slug: "philippians",       chapters: 4   },
  { name: "Colossians",       slug: "colossians",        chapters: 4   },
  { name: "1 Thessalonians",  slug: "1-thessalonians",   chapters: 5   },
  { name: "2 Thessalonians",  slug: "2-thessalonians",   chapters: 3   },
  { name: "1 Timothy",        slug: "1-timothy",         chapters: 6   },
  { name: "2 Timothy",        slug: "2-timothy",         chapters: 4   },
  { name: "Titus",            slug: "titus",             chapters: 3   },
  { name: "Philemon",         slug: "philemon",          chapters: 1   },
  { name: "Hebrews",          slug: "hebrews",           chapters: 13  },
  { name: "James",            slug: "james",             chapters: 5   },
  { name: "1 Peter",          slug: "1-peter",           chapters: 5   },
  { name: "2 Peter",          slug: "2-peter",           chapters: 3   },
  { name: "1 John",           slug: "1-john",            chapters: 5   },
  { name: "2 John",           slug: "2-john",            chapters: 1   },
  { name: "3 John",           slug: "3-john",            chapters: 1   },
  { name: "Jude",             slug: "jude",              chapters: 1   },
  { name: "Revelation",       slug: "revelation",        chapters: 22  },
];

/* ── Parse pathname → { bookSlug, chapter, verse } ── */
function parsePath(pathname: string) {
  // /bible/[book]/[chapter]/[verse]
  const m = pathname.match(/^\/bible\/([^/]+)(?:\/(\d+)(?:\/(\d+))?)?/);
  if (!m) return { bookSlug: null, chapter: null, verse: null };
  return {
    bookSlug: m[1] ?? null,
    chapter: m[2] ? parseInt(m[2], 10) : null,
    verse: m[3] ? parseInt(m[3], 10) : null,
  };
}

export default function BibleNavSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { bookSlug, chapter, verse } = parsePath(pathname);
  const currentBook = BOOKS.find((b) => b.slug === bookSlug) ?? null;

  const [mobileOpen, setMobileOpen] = useState(false);
  const verseRef = useRef<HTMLInputElement>(null);

  function handleBookChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`/bible/${e.target.value}/1`);
    setMobileOpen(false);
  }

  function handleVerseJump(e: FormEvent) {
    e.preventDefault();
    const v = parseInt(verseRef.current?.value ?? "", 10);
    if (bookSlug && chapter && v > 0) {
      router.push(`/bible/${bookSlug}/${chapter}/${v}`);
      setMobileOpen(false);
    }
  }

  const sidebarContent = (
    <div className="flex flex-col gap-5 py-4 px-3">

      {/* ── Book selector ── */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
          Book
        </p>
        <select
          value={bookSlug ?? ""}
          onChange={handleBookChange}
          className="w-full text-sm rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent appearance-none cursor-pointer"
        >
          <option value="" disabled>Select a book…</option>
          {BOOKS.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Chapter list ── */}
      {currentBook && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
            Chapters — {currentBook.name}
          </p>
          <div
            className="grid gap-1 overflow-y-auto"
            style={{
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              maxHeight: "14rem",
              scrollbarWidth: "thin",
              scrollbarColor: "#e5e7eb transparent",
            }}
          >
            {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((n) => {
              const isActive = chapter === n;
              return (
                <Link
                  key={n}
                  href={`/bible/${currentBook.slug}/${n}`}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-center rounded text-xs font-medium h-7 transition-colors ${
                    isActive
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                  }`}
                >
                  {n}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Verse jump ── */}
      {currentBook && chapter !== null && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
            {verse !== null ? (
              <>Verse <span className="text-amber-600">{verse}</span></>
            ) : (
              "Jump to Verse"
            )}
          </p>
          <form onSubmit={handleVerseJump} className="flex gap-1.5">
            <input
              ref={verseRef}
              type="number"
              min={1}
              placeholder="e.g. 16"
              defaultValue={verse ?? ""}
              className="flex-1 min-w-0 text-sm rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
            >
              Go
            </button>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Mobile toggle ── */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-300 transition-colors w-full"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="flex-1 text-left">
            {currentBook
              ? `${currentBook.name}${chapter ? ` · Ch. ${chapter}` : ""}${verse ? `:${verse}` : ""}`
              : "Browse Bible"}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {mobileOpen && (
          <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-lg">
            {sidebarContent}
          </div>
        )}
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:block w-48 flex-shrink-0 sticky top-6 self-start rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {sidebarContent}
      </aside>
    </>
  );
}
