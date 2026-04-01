import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/content.json";

type Question = {
  slug: string;
  title: string;
  topic: string;
  shortAnswer: string;
  content?: string;
  sections: {
    explanation: string;
    meaning: string;
    application: string;
  };
};

const questions = data.questions as Question[];

function getQuestion(slug: string): Question | undefined {
  return questions.find((q) => q.slug === slug);
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const question = getQuestion(slug);
  return {
    title: question
      ? `${question.title} | Faith & Scripture`
      : "Question | Faith & Scripture",
  };
}

const sectionLabels: Record<keyof Question["sections"], string> = {
  explanation: "Explanation",
  meaning: "What It Means",
  application: "How to Apply It",
};

export default async function QuestionPage({ params }: Props) {
  const { slug } = await params;
  const question = getQuestion(slug);
  const related = questions.filter((q) => q.slug !== slug).slice(0, 3);

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

      {question ? (
        <article>
          <header className="mb-8">
            <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2.5 py-0.5 mb-4">
              {question.topic}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-5">
              {question.title}
            </h1>
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-5 py-4">
              <p className="text-base text-gray-800 leading-relaxed font-medium">
                {question.shortAnswer}
              </p>
            </div>
          </header>

          {question.content ? (
            <div
              className="prose prose-gray max-w-none prose-h2:text-lg prose-h2:font-semibold prose-h2:text-gray-900 prose-h2:mt-8 prose-h2:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-em:text-gray-700"
              dangerouslySetInnerHTML={{ __html: question.content }}
            />
          ) : (
            <div className="space-y-8">
              {(
                Object.keys(sectionLabels) as Array<keyof Question["sections"]>
              ).map((key) => (
                <section key={key}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    {sectionLabels[key]}
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {question.sections[key]}
                  </p>
                </section>
              ))}
            </div>
          )}
        </article>
      ) : (
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Question not found
          </h1>
          <p className="text-gray-500 mb-6">
            The question &ldquo;{slug.replace(/-/g, " ")}&rdquo; could not be
            found.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Related Questions
          </h3>
          <div className="space-y-2">
            {related.map((q) => (
              <Link
                key={q.slug}
                href={`/questions/${q.slug}`}
                className="block text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {q.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
