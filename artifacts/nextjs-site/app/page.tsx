import Link from "next/link";
import data from "@/data/content.json";

type Question = { slug: string; title: string; shortAnswer: string };
type Topic = { slug: string; name: string };

const questions = data.questions as Question[];
const topics = data.topics as Topic[];

export default function HomePage() {
  return (
    <div className="max-w-2xl space-y-14">
      <section className="py-6">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">
          Faith &amp; Scripture
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed">
          Explore questions about faith, browse topics, and study the Bible.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Questions</h2>
        <ul className="space-y-3">
          {questions.map((q) => (
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
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Topics</h2>
        <ul className="space-y-2">
          {topics.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/topics/${t.slug}`}
                className="block rounded-lg border border-gray-200 px-5 py-3 font-medium text-gray-800 hover:border-gray-300 hover:text-blue-700 hover:shadow-sm transition-all"
              >
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
