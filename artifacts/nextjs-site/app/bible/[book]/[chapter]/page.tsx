import type { Metadata } from "next";
import Link from "next/link";
// @ts-ignore — JS module without type declarations
import { getChapter } from "@/lib/bible.js";

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
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>

      {verses.length > 0 ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {bookName} {chapterNum}{" "}
              <span className="text-sm font-normal text-gray-400 ml-1">KJV</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              {verses.map((v) => (
                <div key={v.reference} className="flex gap-3">
                  <span className="flex-shrink-0 text-xs font-semibold text-gray-300 w-6 mt-1 text-right select-none">
                    {verseNumber(v.reference)}
                  </span>
                  <p className="text-gray-800 leading-relaxed">{v.text}</p>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
              <p className="text-sm font-medium text-gray-400 italic">
                Explanation coming soon
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
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
