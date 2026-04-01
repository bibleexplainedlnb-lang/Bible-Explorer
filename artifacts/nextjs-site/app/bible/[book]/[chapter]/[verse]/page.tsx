import type { Metadata } from "next";
import Link from "next/link";
// @ts-ignore — JS module without type declarations
import { getVerse } from "@/lib/bible.js";

function slugToBookName(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface Props {
  params: Promise<{ book: string; chapter: string; verse: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { book, chapter, verse } = await params;
  const bookName = slugToBookName(book);
  return {
    title: `${bookName} ${chapter}:${verse} (KJV) | Bible | Faith & Scripture`,
  };
}

export default async function VersePage({ params }: Props) {
  const { book, chapter, verse } = await params;
  const bookName = slugToBookName(book);
  const reference = `${bookName} ${chapter}:${verse}`;
  const text: string | null = getVerse(reference);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href={`/bible/${book}/${chapter}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; {bookName} {chapter}
        </Link>
      </div>

      {text ? (
        <>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            {reference} &mdash; KJV
          </p>

          <blockquote className="border-l-4 border-gray-300 pl-5 py-1 my-6">
            <p className="text-xl text-gray-900 leading-relaxed font-serif">
              {text}
            </p>
          </blockquote>

          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-sm font-medium text-gray-500 mb-1">Explanation</p>
            <p className="text-sm text-gray-400 italic">Coming soon</p>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Verse not found
          </h1>
          <p className="text-gray-500 mb-6">
            {reference} could not be found.
          </p>
          <Link
            href={`/bible/${book}/${chapter}`}
            className="text-blue-600 hover:underline"
          >
            Back to {bookName} {chapter}
          </Link>
        </div>
      )}
    </div>
  );
}
