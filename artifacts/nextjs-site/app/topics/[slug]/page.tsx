import type { Metadata } from "next";
import Link from "next/link";

const topicData: Record<
  string,
  {
    name: string;
    description: string;
    questions: { slug: string; title: string }[];
    guides: { slug: string; title: string }[];
  }
> = {
  faith: {
    name: "Faith",
    description:
      "Faith is the foundation of the Christian life — trusting God's promises even when we cannot see the full picture. Explore what Scripture says about faith, doubt, and growing in trust.",
    questions: [
      { slug: "what-is-faith", title: "What is faith and why does it matter?" },
      { slug: "why-read-bible", title: "Why should I read the Bible daily?" },
    ],
    guides: [
      { slug: "growing-in-faith", title: "A Beginner's Guide to Growing in Faith" },
      { slug: "faith-and-doubt", title: "When Doubt Meets Faith: A Practical Guide" },
    ],
  },
  prayer: {
    name: "Prayer",
    description:
      "Prayer is conversation with God — an act of worship, dependence, and relationship. Discover how to pray, when to pray, and what happens when we do.",
    questions: [
      { slug: "how-to-pray", title: "How should I pray?" },
    ],
    guides: [
      { slug: "daily-prayer", title: "Building a Daily Prayer Habit" },
      { slug: "types-of-prayer", title: "Understanding Different Types of Prayer" },
    ],
  },
  salvation: {
    name: "Salvation",
    description:
      "Salvation is the central message of the gospel — God's rescue of humanity through Jesus Christ. Explore what the Bible teaches about grace, redemption, and eternal life.",
    questions: [
      { slug: "meaning-of-grace", title: "What does grace mean in the Bible?" },
    ],
    guides: [
      { slug: "plan-of-salvation", title: "Understanding the Plan of Salvation" },
      { slug: "assurance-of-salvation", title: "How Can I Know I Am Saved?" },
    ],
  },
  scripture: {
    name: "Scripture",
    description:
      "The Bible is God's Word given to guide, correct, and equip His people. Learn how to read, study, and apply Scripture to your everyday life.",
    questions: [
      { slug: "why-read-bible", title: "Why should I read the Bible daily?" },
    ],
    guides: [
      { slug: "bible-study-basics", title: "Bible Study Basics for Beginners" },
      { slug: "inductive-bible-study", title: "How to Do Inductive Bible Study" },
    ],
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = topicData[slug];
  return {
    title: topic
      ? `${topic.name} | Topics | Faith & Scripture`
      : "Topic | Faith & Scripture",
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = topicData[slug];

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>

      {topic ? (
        <div className="space-y-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {topic.name}
            </h1>
            <p className="text-gray-600 leading-relaxed max-w-2xl">
              {topic.description}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Questions on {topic.name}
            </h2>
            <div className="space-y-3">
              {topic.questions.map((q) => (
                <Link
                  key={q.slug}
                  href={`/questions/${q.slug}`}
                  className="block rounded-lg border border-gray-200 px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <span className="font-medium text-gray-900">{q.title}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Guides on {topic.name}
            </h2>
            <div className="space-y-3">
              {topic.guides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="block rounded-lg border border-gray-200 px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <span className="font-medium text-gray-900">{g.title}</span>
                </Link>
              ))}
            </div>
          </div>
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
