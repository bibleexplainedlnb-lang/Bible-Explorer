import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/content.json";
import { fetchChapter } from "@/lib/bible";
import ExplanationTabs from "./ExplanationTabs";

type BibleExplanation = {
  book: string;
  chapter: number;
  testament: string;
  explanation: {
    overview: string;
    context: string;
    application: string;
  };
};

const explanations = data.bibleExplanations as BibleExplanation[];

function getExplanation(book: string, chapter: number): BibleExplanation | undefined {
  return explanations.find(
    (e) => e.book === book.toLowerCase() && e.chapter === chapter
  );
}

interface Props {
  params: Promise<{ book: string; chapter: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { book, chapter } = await params;
  const chapterNum = parseInt(chapter, 10);
  const explanation = getExplanation(book, chapterNum);
  const bookDisplay = explanation
    ? book.charAt(0).toUpperCase() + book.slice(1)
    : book;
  return {
    title: `${bookDisplay} ${chapterNum} (KJV) | Bible | Faith & Scripture`,
  };
}

export default async function BibleChapterPage({ params }: Props) {
  const { book, chapter } = await params;
  const chapterNum = parseInt(chapter, 10);

  const [kjvChapter, explanation] = await Promise.all([
    fetchChapter(book, chapterNum),
    Promise.resolve(getExplanation(book, chapterNum)),
  ]);

  const bookDisplay = kjvChapter?.book ?? (book.charAt(0).toUpperCase() + book.slice(1));
  const testament = explanation?.testament ?? null;

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

      {kjvChapter ? (
        <>
          <div className="mb-6">
            {testament && (
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                {testament}
              </p>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {bookDisplay} {chapterNum}{" "}
              <span className="text-sm font-normal text-gray-400 ml-1">KJV</span>
            </h1>
          </div>

          <div className={`grid grid-cols-1 gap-8 items-start ${explanation ? "lg:grid-cols-2" : ""}`}>
            <div className="space-y-4">
              {kjvChapter.verses.map((verse) => (
                <div key={verse.verse} className="flex gap-3">
                  <span className="flex-shrink-0 text-xs font-semibold text-gray-300 w-6 mt-1 text-right select-none">
                    {verse.verse}
                  </span>
                  <p className="text-gray-800 leading-relaxed">{verse.text}</p>
                </div>
              ))}
            </div>

            {explanation && (
              <div className="lg:sticky lg:top-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <ExplanationTabs explanation={explanation.explanation} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
            {chapterNum > 1 ? (
              <Link
                href={`/bible/${book}/${chapterNum - 1}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                &larr; {bookDisplay} {chapterNum - 1}
              </Link>
            ) : (
              <span />
            )}
            <Link
              href={`/bible/${book}/${chapterNum + 1}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              {bookDisplay} {chapterNum + 1} &rarr;
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Chapter not found
          </h1>
          <p className="text-gray-500 mb-6">
            {book} chapter {chapterNum} could not be loaded.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      )}
    </div>
  );
}
