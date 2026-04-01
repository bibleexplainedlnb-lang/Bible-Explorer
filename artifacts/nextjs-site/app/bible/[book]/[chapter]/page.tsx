import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/content.json";
import ExplanationTabs from "./ExplanationTabs";

type BibleChapter = {
  book: string;
  bookName: string;
  testament: string;
  chapter: number;
  verses: { number: number; text: string }[];
  explanation: {
    overview: string;
    context: string;
    application: string;
  };
};

const chapters = data.bibleChapters as BibleChapter[];

function getChapter(book: string, chapter: number): BibleChapter | undefined {
  return chapters.find(
    (c) => c.book === book.toLowerCase() && c.chapter === chapter
  );
}

interface Props {
  params: Promise<{ book: string; chapter: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { book, chapter } = await params;
  const chapterNum = parseInt(chapter, 10);
  const found = getChapter(book, chapterNum);
  return {
    title: found
      ? `${found.bookName} ${chapterNum} | Bible | Faith & Scripture`
      : "Bible | Faith & Scripture",
  };
}

export default async function BibleChapterPage({ params }: Props) {
  const { book, chapter } = await params;
  const chapterNum = parseInt(chapter, 10);
  const found = getChapter(book, chapterNum);

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

      {found ? (
        <>
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              {found.testament}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              {found.bookName} {found.chapter}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              {found.verses.map((verse) => (
                <div key={verse.number} className="flex gap-3">
                  <span className="flex-shrink-0 text-xs font-semibold text-gray-300 w-6 mt-1 text-right select-none">
                    {verse.number}
                  </span>
                  <p className="text-gray-800 leading-relaxed">{verse.text}</p>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <ExplanationTabs explanation={found.explanation} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
            {chapterNum > 1 ? (
              <Link
                href={`/bible/${book}/${chapterNum - 1}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                &larr; {found.bookName} {chapterNum - 1}
              </Link>
            ) : (
              <span />
            )}
            <Link
              href={`/bible/${book}/${chapterNum + 1}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              {found.bookName} {chapterNum + 1} &rarr;
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Chapter not found
          </h1>
          <p className="text-gray-500 mb-6">
            {book} chapter {chapterNum} is not available yet.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      )}
    </div>
  );
}
