import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/content.json";
import { linkifyHtml } from "@/lib/bible-references";

type Guide = {
  slug: string;
  title: string;
  shortDescription: string;
  content: string;
  relatedQuestions: string[];
  relatedTopics: string[];
};

type Question = {
  slug: string;
  title: string;
  shortAnswer: string;
  topic: string;
};

type Topic = {
  slug: string;
  name: string;
  questions: string[];
};

const guides = data.guides as Guide[];
const questions = data.questions as Question[];
const topics = data.topics as Topic[];

function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

function resolveQuestions(slugs: string[]): Question[] {
  return slugs
    .map((s) => questions.find((q) => q.slug === s))
    .filter((q): q is Question => q !== undefined);
}

function resolveTopics(slugs: string[]): Topic[] {
  return slugs
    .map((s) => topics.find((t) => t.slug === s))
    .filter((t): t is Topic => t !== undefined);
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  return {
    title: guide
      ? `${guide.title} | Guides | Faith & Scripture`
      : "Guide not found | Faith & Scripture",
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);

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

  const relatedQuestions = resolveQuestions(guide.relatedQuestions);
  const relatedTopics = resolveTopics(guide.relatedTopics);

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
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Related Questions
          </h2>
          <ul className="space-y-3">
            {relatedQuestions.map((q) => (
              <li key={q.slug}>
                <Link
                  href={`/questions/${q.slug}`}
                  className="group flex flex-col gap-0.5"
                >
                  <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {q.title}
                  </span>
                  <span className="text-sm text-gray-500 line-clamp-1">
                    {q.shortAnswer}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related Topics */}
      {relatedTopics.length > 0 && (
        <section className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Related Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedTopics.map((t) => (
              <Link
                key={t.slug}
                href={`/topics/${t.slug}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                  {t.name}
                </span>
                <span className="text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                  {t.questions.length} {t.questions.length === 1 ? "question" : "questions"} &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
