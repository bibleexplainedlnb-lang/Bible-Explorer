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
  const q = qdb.findBySlug(slug);
  return {
    title: q ? `${q.title} | Faith & Scripture` : "Not found | Faith & Scripture",
  };
}

function getRelated(currentSlug: string, currentTopic: string, min = 3, max = 5) {
  const sameTopic = qdb.listByTopic(currentTopic).filter((q) => q.slug !== currentSlug);
  const rest = qdb.list().filter((q) => q.slug !== currentSlug && q.topic !== currentTopic);
  const count = Math.min(Math.max(sameTopic.length || min, min), max);
  return [...sameTopic, ...rest].slice(0, count);
}

export default async function QuestionPage({ params }: Props) {
  const { slug } = await params;
  const q = qdb.findBySlug(slug);

  if (!q) {
    return (
      <div className="max-w-2xl text-center py-20">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Not found</h1>
        <p className="text-gray-500 mb-6">
          No question matches &ldquo;{slug.replace(/-/g, " ")}&rdquo;.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  const related = getRelated(q.slug, q.topic);
  const topic = tdb.findByName(q.topic);
  const guide = gdb.findByRelatedQuestion(q.slug);
  const topicQuestionCount = topic ? parseJsonArray(topic.questionSlugs).length : 0;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>

      <article>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-5">
          {q.title}
        </h1>

        <div className="rounded-lg bg-gray-50 border border-gray-200 px-5 py-4 mb-8">
          <p className="text-base text-gray-800 leading-relaxed font-medium">
            {q.shortAnswer}
          </p>
        </div>

        {q.content ? (
          <div
            className="prose prose-gray max-w-none prose-h2:text-lg prose-h2:font-semibold prose-h2:text-gray-900 prose-h2:mt-8 prose-h2:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-em:text-gray-700"
            dangerouslySetInnerHTML={{ __html: linkifyHtml(q.content) }}
          />
        ) : (
          <p className="text-gray-500 italic">No content available for this question.</p>
        )}
      </article>

      {guide && (
        <div className="mt-10 pt-8 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Read Full Guide
          </p>
          <Link
            href={`/guides/${guide.slug}`}
            className="group flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 hover:border-blue-300 hover:bg-blue-100 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-blue-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">
                {guide.title}
              </p>
              <p className="text-sm text-blue-600/80 line-clamp-2 leading-relaxed">
                {guide.shortDescription}
              </p>
            </div>
            <svg
              className="flex-shrink-0 mt-0.5 w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {topic && (
        <div className="mt-10 pt-8 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Explore this topic
          </p>
          <Link
            href={`/topics/${topic.slug}`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
              {topic.name}
            </span>
            <span className="text-gray-400 group-hover:text-blue-500 transition-colors text-sm">
              {topicQuestionCount} {topicQuestionCount === 1 ? "question" : "questions"} &rarr;
            </span>
          </Link>
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-14 pt-8 border-t border-gray-200">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Related Questions
          </h2>
          <ul className="space-y-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/questions/${r.slug}`}
                  className="group flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">
                      {r.title}
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                      {r.shortAnswer}
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
