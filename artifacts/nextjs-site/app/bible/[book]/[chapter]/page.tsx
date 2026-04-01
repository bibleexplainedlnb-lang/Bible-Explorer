import type { Metadata } from "next";
import Link from "next/link";
// @ts-ignore — JS module without type declarations
import { getChapter } from "@/lib/bible.js";
import ChapterSidebar from "./ChapterSidebar";

function slugToBookName(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function verseNumber(reference: string): string {
  return reference.split(":")[1] ?? "";
}

interface Props {
  params: Promise<{ book: string; chapter: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { book, chapter } = await params;
  const bookName = slugToBookName(book);
  return {
    title: `${bookName} ${chapter} (KJV) | Bible | Faith & Scripture`,
  };
}

export default async function BibleChapterPage({ params }: Props) {
  const { book, chapter } = await params;
  const chapterNum = parseInt(chapter, 10);
  const bookName = slugToBookName(book);

  const verses: { reference: string; text: string }[] = getChapter(bookName, chapterNum);

  return (
    <div>
      <div className="mb-5">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>

      {verses.length > 0 ? (
        <>
          {/* Chapter heading */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900">
              {bookName} {chapterNum}{" "}
              <span className="text-sm font-normal text-gray-400 ml-1">KJV</span>
            </h1>
          </div>

          {/* Two-column reader layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

            {/* LEFT — scrollable verse list */}
            <div
              className="lg:overflow-y-auto lg:max-h-[calc(100vh-11rem)] pr-1 scroll-smooth"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}
            >
              <div className="space-y-5 pb-6">
                {verses.map((v) => (
                  <div
                    key={v.reference}
                    id={`v${verseNumber(v.reference)}`}
                    className="flex gap-3 group"
                  >
                    {/* Verse number badge */}
                    <span className="flex-shrink-0 mt-[3px] w-7 text-right select-none">
                      <span className="inline-block text-[11px] font-bold leading-none text-amber-600 bg-amber-50 border border-amber-200 rounded px-1 py-0.5">
                        {verseNumber(v.reference)}
                      </span>
                    </span>
                    {/* Verse text */}
                    <p className="text-[1.0625rem] leading-[1.8] text-gray-800">
                      {v.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Prev / next navigation inside the scroll area */}
              <div className="flex items-center justify-between pt-5 border-t border-gray-200">
                {chapterNum > 1 ? (
                  <Link
                    href={`/bible/${book}/${chapterNum - 1}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    &larr; {bookName} {chapterNum - 1}
                  </Link>
                ) : (
                  <span />
                )}
                <Link
                  href={`/bible/${book}/${chapterNum + 1}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {bookName} {chapterNum + 1} &rarr;
                </Link>
              </div>
            </div>

            {/* RIGHT — sticky sidebar */}
            <ChapterSidebar verseCount={verses.length} />
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Chapter not found
          </h1>
          <p className="text-gray-500 mb-6">
            {bookName} chapter {chapterNum} could not be found.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      )}
    </div>
  );
}
