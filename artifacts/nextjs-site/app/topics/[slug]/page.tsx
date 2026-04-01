import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/content.json";

type Topic = { slug: string; name: string };
type Question = { slug: string; title: string; topic: string; shortAnswer: string };

const topics = data.topics as Topic[];
const questions = data.questions as Question[];

function getTopic(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug);
}

function getRelatedQuestions(topicName: string): Question[] {
  return questions.filter(
    (q) => q.topic.toLowerCase() === topicName.toLowerCase()
  );
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopic(slug);
  return {
    title: topic
      ? `${topic.name} | Topics | Faith & Scripture`
      : "Topic | Faith & Scripture",
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = getTopic(slug);
  const relatedQuestions = topic ? getRelatedQuestions(topic.name) : [];

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

      {topic ? (
        <div className="space-y-8">
          <h1 className="text-3xl font-bold text-gray-900">{topic.name}</h1>

          <section>
            <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Questions
            </h2>
            {relatedQuestions.length > 0 ? (
              <ul className="space-y-3">
                {relatedQuestions.map((q) => (
                  <li key={q.slug}>
                    <Link
                      href={`/questions/${q.slug}`}
                      className="block rounded-lg border border-gray-200 px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all group"
                    >
                      <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                        {q.title}
                      </p>
                      {q.shortAnswer && (
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                          {q.shortAnswer}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No questions found for this topic yet.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Topic not found
          </h1>
          <p className="text-gray-500 mb-6">
            The topic &ldquo;{slug.replace(/-/g, " ")}&rdquo; could not be found.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      )}
    </div>
  );
}
