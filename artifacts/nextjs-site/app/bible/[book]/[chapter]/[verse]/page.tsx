import type { Metadata } from "next";
import Link from "next/link";
// @ts-ignore — JS module without type declarations
import { getVerse } from "@/lib/bible.js";
import data from "@/data/content.json";

type Question = {
  slug: string;
  title: string;
  shortAnswer: string;
  content?: string;
  topic: string;
};

const questions = data.questions as Question[];

function slugToBookName(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function findRelatedQuestions(
  reference: string,
  bookName: string,
  max = 4
): Question[] {
  const refLower = reference.toLowerCase();
  const bookLower = bookName.toLowerCase();

  // Score each question: 2 pts for exact reference match, 1 pt for book name mention
  const scored = questions.map((q) => {
    const haystack = [
      q.title,
      q.shortAnswer,
      q.content ? stripHtml(q.content) : "",
    ]
      .join(" ")
      .toLowerCase();

    let score = 0;
    if (haystack.includes(refLower)) score += 2;
    else if (haystack.includes(bookLower)) score += 1;
    return { q, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ q }) => q);
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

  if (!text) {
    return (
      <div className="max-w-2xl text-center py-16">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Verse not found
        </h1>
        <p className="text-gray-500 mb-6">{reference} could not be found.</p>
        <Link href={`/bible/${book}/${chapter}`} className="text-blue-600 hover:underline">
          Back to {bookName} {chapter}
        </Link>
      </div>
    );
  }

  const related = findRelatedQuestions(reference, bookName);

  return (
    <div className="max-w-2xl">
      {/* Back link */}
      <div className="mb-8">
        <Link
          href={`/bible/${book}/${chapter}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; {bookName} {chapter}
        </Link>
      </div>

      {/* Reference label */}
      <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-4">
        {reference} &mdash; KJV
      </p>

      {/* Highlighted verse */}
      <div className="relative rounded-xl bg-amber-50 border border-amber-200 px-6 py-5 mb-8">
        <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-amber-400 ml-0 -ml-px" />
        <p className="text-xl text-gray-900 leading-relaxed font-serif pl-1">
          {text}
        </p>
      </div>

      {/* Simple explanation */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 mb-10">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Simple Explanation
        </p>
        <p className="text-sm text-gray-500 leading-relaxed italic">
          A plain-language explanation of this verse will appear here — covering
          what it means in context and how it applies to everyday faith.
        </p>
      </div>

      {/* Related questions */}
      {related.length > 0 && (
        <section className="pt-8 border-t border-gray-200">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Related Questions
          </h2>
          <ul className="space-y-3">
            {related.map((q) => (
              <li key={q.slug}>
                <Link
                  href={`/questions/${q.slug}`}
                  className="group flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">
                      {q.title}
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                      {q.shortAnswer}
                    </p>
                  </div>
                  <svg className="flex-shrink-0 mt-0.5 w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
