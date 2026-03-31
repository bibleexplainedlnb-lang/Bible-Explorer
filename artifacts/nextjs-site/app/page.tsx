import Link from "next/link";

const featuredQuestions = [
  {
    slug: "what-is-faith",
    title: "What is faith and why does it matter?",
    excerpt:
      "Faith is the substance of things hoped for, the evidence of things not seen. Explore what this means for everyday life.",
    topic: "Faith",
  },
  {
    slug: "how-to-pray",
    title: "How should I pray?",
    excerpt:
      "Prayer is a conversation with God. Learn different approaches to prayer and how to make it a daily practice.",
    topic: "Prayer",
  },
  {
    slug: "meaning-of-grace",
    title: "What does grace mean in the Bible?",
    excerpt:
      "Grace is one of the most important concepts in Scripture. Discover its meaning and how it changes everything.",
    topic: "Salvation",
  },
  {
    slug: "why-read-bible",
    title: "Why should I read the Bible daily?",
    excerpt:
      "Regular Scripture reading transforms the mind and deepens your relationship with God. Here is how to get started.",
    topic: "Scripture",
  },
];

const topics = [
  { slug: "faith", name: "Faith", count: 24 },
  { slug: "prayer", name: "Prayer", count: 18 },
  { slug: "salvation", name: "Salvation", count: 31 },
  { slug: "scripture", name: "Scripture", count: 15 },
  { slug: "holy-spirit", name: "Holy Spirit", count: 22 },
  { slug: "worship", name: "Worship", count: 12 },
  { slug: "forgiveness", name: "Forgiveness", count: 19 },
  { slug: "discipleship", name: "Discipleship", count: 27 },
  { slug: "church", name: "Church", count: 14 },
  { slug: "love", name: "Love", count: 33 },
];

const bibleBooks = [
  { book: "genesis", name: "Genesis", chapter: 1, testament: "Old Testament" },
  { book: "psalms", name: "Psalms", chapter: 23, testament: "Old Testament" },
  { book: "proverbs", name: "Proverbs", chapter: 1, testament: "Old Testament" },
  { book: "john", name: "John", chapter: 1, testament: "New Testament" },
  { book: "romans", name: "Romans", chapter: 8, testament: "New Testament" },
  { book: "revelation", name: "Revelation", chapter: 1, testament: "New Testament" },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="text-center py-10">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Faith &amp; Scripture
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Explore questions about faith, browse topics, read guides, and study
          the Bible — all in one place.
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Featured Questions
          </h2>
          <Link
            href="/questions/what-is-faith"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featuredQuestions.map((q) => (
            <Link
              key={q.slug}
              href={`/questions/${q.slug}`}
              className="block rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2.5 py-0.5 mb-3">
                {q.topic}
              </span>
              <h3 className="font-semibold text-gray-900 mb-2 leading-snug">
                {q.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {q.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Topics</h2>
          <Link
            href="/topics/faith"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Browse all &rarr;
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all"
            >
              {topic.name}
              <span className="text-xs text-gray-400">{topic.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Bible Reading
          </h2>
          <Link
            href="/bible/genesis/1"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Open Bible &rarr;
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bibleBooks.map((b) => (
            <Link
              key={`${b.book}-${b.chapter}`}
              href={`/bible/${b.book}/${b.chapter}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div>
                <p className="font-medium text-gray-900">{b.name}</p>
                <p className="text-xs text-gray-500">{b.testament}</p>
              </div>
              <span className="text-sm text-gray-400">Chapter {b.chapter} &rarr;</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
