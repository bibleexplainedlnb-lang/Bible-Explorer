import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/content.json";

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
            dangerouslySetInnerHTML={{ __html: q.content }}
          />
        ) : (
          <p className="text-gray-500 italic">No content available for this question.</p>
        )}
      </article>
    </div>
  );
}
