import type { Metadata } from "next";
import Link from "next/link";

const guideData: Record<
  string,
  { title: string; topic: string; readTime: string; sections: { heading: string; body: string }[] }
> = {
  "growing-in-faith": {
    title: "A Beginner's Guide to Growing in Faith",
    topic: "Faith",
    readTime: "8 min read",
    sections: [
      {
        heading: "Start with Scripture",
        body: "The most direct way to grow in faith is to read the Bible regularly. Romans 10:17 says faith comes from hearing, and hearing through the word of Christ. Set aside a specific time each day — even 10-15 minutes is a meaningful start.",
      },
      {
        heading: "Pray Consistently",
        body: "Prayer is not a spiritual performance — it is honest communication with God. Tell Him what you are grateful for, where you are struggling, and what you need. Over time, prayer shapes your heart to align with God's purposes.",
      },
      {
        heading: "Find a Community",
        body: "Hebrews 10:24-25 urges believers not to neglect meeting together. A church community provides accountability, encouragement, and growth opportunities that are difficult to find alone. Look for a community where Scripture is taught faithfully.",
      },
      {
        heading: "Serve Others",
        body: "Faith grows when it is put into action. Look for opportunities to serve in your church, neighborhood, or workplace. Serving others shifts the focus from self to God and neighbor — which is exactly where Jesus calls us to live.",
      },
      {
        heading: "Be Patient with the Process",
        body: "Growth in faith rarely feels dramatic. It is usually slow, steady, and punctuated by difficult seasons that shape character. Trust that God is at work even in times of dryness or doubt.",
      },
    ],
  },
  "daily-prayer": {
    title: "Building a Daily Prayer Habit",
    topic: "Prayer",
    readTime: "6 min read",
    sections: [
      {
        heading: "Choose a Time and Place",
        body: "Consistency is built on routine. Choose a specific time — morning, lunch, or evening — and a quiet place where you will not be easily interrupted. Even a corner of your room can become a sacred space.",
      },
      {
        heading: "Use a Simple Framework",
        body: "The acronym ACTS can help structure your prayer: Adoration (praise God for who He is), Confession (acknowledge your sins honestly), Thanksgiving (express gratitude), and Supplication (bring your requests and the needs of others).",
      },
      {
        heading: "Keep a Prayer Journal",
        body: "Writing down your prayers helps you focus and creates a record of how God has answered over time. Even brief notes — a one-sentence prayer and a one-sentence answer — build faith as you look back.",
      },
      {
        heading: "Start Small",
        body: "Five minutes of sincere prayer is better than thirty minutes of distracted prayer. Start with what you can sustain and let it grow naturally. The goal is a relationship, not a performance metric.",
      },
    ],
  },
  "bible-study-basics": {
    title: "Bible Study Basics for Beginners",
    topic: "Scripture",
    readTime: "7 min read",
    sections: [
      {
        heading: "Observe What the Text Says",
        body: "Before interpreting a passage, observe it carefully. Ask: Who is speaking? To whom? What is happening? When and where? Look for repeated words, contrasts, and connections. Good observation prevents common misunderstandings.",
      },
      {
        heading: "Interpret What It Means",
        body: "Ask what the passage meant to its original audience before asking what it means for you. Use context — what comes before and after the passage. If a verse is unclear, read it in several translations.",
      },
      {
        heading: "Apply What You Learn",
        body: "Bible study is incomplete without application. Ask: Is there a command to obey? A promise to trust? A warning to heed? A truth to believe? Write down one specific way to apply what you have read.",
      },
      {
        heading: "Recommended Starting Points",
        body: "New readers often benefit from starting with the Gospel of John for an introduction to Jesus, then Romans for a systematic understanding of the gospel, then Psalms for devotional and emotional connection with God.",
      },
    ],
  },
  "plan-of-salvation": {
    title: "Understanding the Plan of Salvation",
    topic: "Salvation",
    readTime: "9 min read",
    sections: [
      {
        heading: "God's Design and Humanity's Dilemma",
        body: "God created humanity in His image for relationship with Him. But sin — choosing our own way over God's — broke that relationship. Romans 3:23 states that all have sinned and fall short of God's glory.",
      },
      {
        heading: "The Consequence of Sin",
        body: "Sin carries a consequence: separation from God both in this life and eternally. Romans 6:23 says the wages of sin is death. This is not merely physical death but spiritual separation from the source of all life.",
      },
      {
        heading: "God's Rescue Plan",
        body: "Rather than leaving humanity in this condition, God acted. He sent His Son Jesus Christ to live the perfect life we could not live, die in our place as a substitute, and rise from the dead — defeating sin and death.",
      },
      {
        heading: "Our Response",
        body: "Romans 10:9 says if you confess with your mouth that Jesus is Lord and believe in your heart that God raised him from the dead, you will be saved. Salvation is received through faith — trusting Jesus alone, not our own efforts.",
      },
      {
        heading: "What Comes Next",
        body: "Salvation begins a new life. The believer is forgiven, adopted into God's family, and given the Holy Spirit. This life is marked by growing love for God, Scripture, community, and the ongoing work of becoming more like Jesus.",
      },
    ],
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = guideData[slug];
  return {
    title: guide
      ? `${guide.title} | Guides | Faith & Scripture`
      : "Guide | Faith & Scripture",
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = guideData[slug];

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

      {guide ? (
        <article className="max-w-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2.5 py-0.5">
                {guide.topic}
              </span>
              <span className="text-xs text-gray-400">{guide.readTime}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {guide.title}
            </h1>
          </div>

          <div className="space-y-8">
            {guide.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {section.heading}
                </h2>
                <p className="text-gray-700 leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>
        </article>
      ) : (
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Guide not found
          </h1>
          <p className="text-gray-500 mb-6">
            The guide &ldquo;{slug.replace(/-/g, " ")}&rdquo; could not be found.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      )}
    </div>
  );
}
