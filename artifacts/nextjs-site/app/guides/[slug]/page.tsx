import type { Metadata } from "next";
import Link from "next/link";
import {
  questions as qdb,
  topics as tdb,
  guides as gdb,
  parseJsonArray,
} from "@/lib/db";
import { linkifyHtml } from "@/lib/bible-references";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = gdb.findBySlug(slug);
  return {
    title: guide
      ? `${guide.title} | Guides | Faith & Scripture`
      : "Guide not found | Faith & Scripture",
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = gdb.findBySlug(slug);

  if (!guide) {
    return (
      <div className="max-w-2xl text-center py-16">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Guide not found
        </h1>
        <p className="text-gray-500 mb-6">
          The guide &ldquo;{slug.replace(/-/g, " ")}&rdquo; could not be found.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  const relatedQuestions = qdb.listBySlugs(parseJsonArray(guide.relatedQuestions));
  const relatedTopicSlugs = parseJsonArray(guide.relatedTopics);
  const relatedTopics = relatedTopicSlugs
    .map((s) => tdb.findBySlug(s))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">
          Guide
        </p>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
          {guide.title}
        </h1>
        {guide.shortDescription && (
          <p className="text-base text-gray-500 leading-relaxed">
            {guide.shortDescription}
          </p>
        )}
      </div>

      {/* Content */}
      <div
        className="prose prose-gray max-w-none prose-h2:text-xl prose-h2:font-semibold prose-h2:text-gray-900 prose-h2:mt-10 prose-h2:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-em:text-gray-600"
        dangerouslySetInnerHTML={{ __html: linkifyHtml(guide.content) }}
      />

      {/* Related Questions */}
      {relatedQuestions.length > 0 && (
        <section className="mt-14 pt-8 border-t border-gray-200">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Related Questions
          </h2>
          <ul className="space-y-3">
            {relatedQuestions.map((q) => (
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

      {/* Related Topics */}
      {relatedTopics.length > 0 && (
        <section className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Related Topics
          </h2>
          <ul className="space-y-3">
            {relatedTopics.map((t) => {
              const questionCount = parseJsonArray(t.questionSlugs).length;
              return (
                <li key={t.slug}>
                  <Link
                    href={`/topics/${t.slug}`}
                    className="group flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-violet-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-violet-700 transition-colors leading-snug">
                        {t.name}
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {questionCount} {questionCount === 1 ? "question" : "questions"}
                      </p>
                    </div>
                    <svg className="flex-shrink-0 mt-0.5 w-4 h-4 text-gray-300 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
