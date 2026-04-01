import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/content.json";
import { linkifyHtml } from "@/lib/bible-references";

type Question = {
  slug: string;
  title: string;
  shortAnswer: string;
  content?: string;
  topic: string;
  sections: { explanation: string; meaning: string; application: string };
};

const questions = data.questions as Question[];

function getQuestion(slug: string): Question | undefined {
  return questions.find((q) => q.slug === slug);
}

function getRelated(current: Question, min = 3, max = 5): Question[] {
  const others = questions.filter((q) => q.slug !== current.slug);
  const sameTopic = others.filter((q) => q.topic === current.topic);
  const rest = others.filter((q) => q.topic !== current.topic);

  const combined = [...sameTopic, ...rest];
  const count = Math.min(Math.max(sameTopic.length || min, min), max);
  return combined.slice(0, count);
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const q = getQuestion(slug);
  return {
    title: q ? `${q.title} | Faith & Scripture` : "Not found | Faith & Scripture",
  };
}

export default async function QuestionPage({ params }: Props) {
  const { slug } = await params;
  const q = getQuestion(slug);

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

  const related = getRelated(q);

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

      {related.length > 0 && (
        <section className="mt-14 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Related Questions
          </h2>
          <ul className="space-y-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/questions/${r.slug}`}
                  className="group flex flex-col gap-0.5"
                >
                  <span className="text-gray-900 font-medium group-hover:text-blue-600 transition-colors">
                    {r.title}
                  </span>
                  <span className="text-sm text-gray-500 line-clamp-1">
                    {r.shortAnswer}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
