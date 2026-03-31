import type { Metadata } from "next";
import Link from "next/link";

const questionData: Record<
  string,
  { title: string; topic: string; content: string[] }
> = {
  "what-is-faith": {
    title: "What is faith and why does it matter?",
    topic: "Faith",
    content: [
      "Faith is described in Hebrews 11:1 as \"the substance of things hoped for, the evidence of things not seen.\" It is not blind belief but confident trust grounded in what God has revealed.",
      "Faith matters because it is the foundation of our relationship with God. Without faith it is impossible to please God, for whoever would draw near to Him must believe that He exists and that He rewards those who seek Him (Hebrews 11:6).",
      "Faith is also the means by which we are justified before God. Paul writes in Romans 5:1 that \"since we have been justified by faith, we have peace with God through our Lord Jesus Christ.\"",
      "Living faith is not static — it grows through prayer, Scripture reading, community, and trusting God through difficult circumstances. James 2:17 reminds us that faith without works is dead, meaning genuine faith produces action.",
    ],
  },
  "how-to-pray": {
    title: "How should I pray?",
    topic: "Prayer",
    content: [
      "Jesus gave His disciples a model for prayer in Matthew 6:9-13, known as the Lord's Prayer. It begins by addressing God as Father and honoring His name, then moves to seeking His kingdom and will.",
      "Effective prayer involves several elements: praise and worship, thanksgiving, confession of sin, intercession for others, and personal petition. These need not follow a rigid order — what matters is sincerity.",
      "1 Thessalonians 5:17 calls believers to \"pray without ceasing,\" meaning prayer is not confined to formal moments but is a continuous attitude of communion with God throughout the day.",
      "Start simple. Even short, honest prayers are heard. As you grow in your prayer life, you may find extended times of quiet, journaling, or structured prayer helpful.",
    ],
  },
  "meaning-of-grace": {
    title: "What does grace mean in the Bible?",
    topic: "Salvation",
    content: [
      "Grace in the Bible refers to God's unmerited favor — His goodness extended to those who do not deserve it. The Greek word charis conveys both beauty and a freely given gift.",
      "Paul captures grace perfectly in Ephesians 2:8-9: \"For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.\"",
      "Grace is not only about salvation. It sustains believers daily. Paul wrote that God's grace was sufficient for him even in weakness (2 Corinthians 12:9), showing that grace empowers us in every circumstance.",
      "Understanding grace transforms how we relate to God and others. Because we have received undeserved kindness, we are called to extend it freely — forgiving as we have been forgiven.",
    ],
  },
  "why-read-bible": {
    title: "Why should I read the Bible daily?",
    topic: "Scripture",
    content: [
      "The Bible is not merely a historical document — it is the living Word of God. Hebrews 4:12 says it is \"living and active, sharper than any two-edged sword,\" able to discern the thoughts and intentions of the heart.",
      "Daily Scripture reading renews the mind (Romans 12:2), guards against sin (Psalm 119:11), and builds faith (Romans 10:17). It is one of the primary ways God speaks to His people.",
      "Psalm 1 describes the blessed person as one who meditates on God's law day and night, like a tree planted by streams of water — fruitful in every season.",
      "Practical tips: Start with a book like John or Mark. Use a reading plan. Journal your observations. Look for what the text says, what it means, and how it applies to your life.",
    ],
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const question = questionData[slug];
  return {
    title: question
      ? `${question.title} | Faith & Scripture`
      : "Question | Faith & Scripture",
  };
}

export default async function QuestionPage({ params }: Props) {
  const { slug } = await params;
  const question = questionData[slug];

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

      {question ? (
        <article className="prose prose-gray max-w-none">
          <div className="mb-6">
            <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2.5 py-0.5 mb-4">
              {question.topic}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {question.title}
            </h1>
          </div>
          <div className="space-y-4">
            {question.content.map((paragraph, i) => (
              <p key={i} className="text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      ) : (
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Question not found
          </h1>
          <p className="text-gray-500 mb-6">
            The question &ldquo;{slug.replace(/-/g, " ")}&rdquo; could not be found.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Related Questions
        </h3>
        <div className="space-y-2">
          {Object.entries(questionData)
            .filter(([s]) => s !== slug)
            .slice(0, 3)
            .map(([s, q]) => (
              <Link
                key={s}
                href={`/questions/${s}`}
                className="block text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {q.title}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
