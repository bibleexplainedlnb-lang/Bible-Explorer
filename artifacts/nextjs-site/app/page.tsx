import Link from "next/link";
import data from "@/data/content.json";

type Question = { slug: string; title: string; shortAnswer: string };
type Topic = { slug: string; name: string };
type Guide = { slug: string; title: string; shortDescription: string };

const questions = data.questions as Question[];
const topics = data.topics as Topic[];
const guides = (data.guides as Guide[]).slice(0, 3);

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

      {guides.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Featured Guides
          </h2>
          <ul className="space-y-3">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guides/${g.slug}`}
                  className="group flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 hover:border-blue-300 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-blue-900 group-hover:text-blue-700 transition-colors leading-snug mb-1">
                      {g.title}
                    </p>
                    <p className="text-sm text-blue-600/80 line-clamp-2 leading-relaxed">
                      {g.shortDescription}
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
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
