import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/content.json";

type Topic = { slug: string; name: string; questions?: string[] };
type Question = { slug: string; title: string; shortAnswer: string; topic: string };
type Guide = { slug: string; title: string; shortDescription: string; relatedTopics: string[] };

const topics = data.topics as Topic[];
const questions = data.questions as Question[];
const guides = data.guides as Guide[];

function getTopic(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug);
}

function getTopicQuestions(topic: Topic): Question[] {
  if (topic.questions && topic.questions.length > 0) {
    return topic.questions
      .map((s) => questions.find((q) => q.slug === s))
      .filter((q): q is Question => q !== undefined);
  }
  return questions.filter(
    (q) => q.topic.toLowerCase() === topic.name.toLowerCase()
  );
}

function getGuideForTopic(topicSlug: string): Guide | undefined {
  return guides.find((g) => g.relatedTopics.includes(topicSlug));
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
      : "Not found | Faith & Scripture",
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = getTopic(slug);

  if (!topic) {
    return (
      <div className="max-w-2xl text-center py-20">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Not found</h1>
        <p className="text-gray-500 mb-6">
          No topic matches &ldquo;{slug.replace(/-/g, " ")}&rdquo;.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to home
        </Link>
      </div>
    );
  }

  const topicQuestions = getTopicQuestions(topic);
  const guide = getGuideForTopic(slug);

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

      <h1 className="text-3xl font-bold text-gray-900 mb-8">{topic.name}</h1>

      {/* Complete Guide banner — above question list */}
      {guide && (
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Complete Guide
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

      {/* Question list */}
      {topicQuestions.length > 0 ? (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Questions
          </p>
          <ul className="space-y-3">
            {topicQuestions.map((q) => (
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
        </>
      ) : (
        <p className="text-gray-500">No questions found for this topic yet.</p>
      )}
    </div>
  );
}
