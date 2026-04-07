import Link from 'next/link';
import { notFound } from 'next/navigation';

const PREFIX = 'bible-verses-about-';

function extractKeyword(slug) {
  if (!slug.startsWith(PREFIX)) return null;
  return slug.slice(PREFIX.length).replaceAll('-', ' ');
}

export function generateMetadata({ params }) {
  const keyword = extractKeyword(params.slug);
  if (!keyword) return { title: 'Not Found' };

  return {
    title: `Bible Verses About ${keyword} (Meaning & Explanation)`,
    description: `Discover powerful Bible verses about ${keyword} with meaning and explanation for daily life.`,
    alternates: { canonical: `/${params.slug}/` },
  };
}

export default function SlugPage({ params }) {
  const keyword = extractKeyword(params.slug);
  if (!keyword) notFound();

  const topicSlug = params.slug.slice(PREFIX.length);
  const keywordCapitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Bible Verses About {keywordCapitalized}</h1>

      <p>
        Explore meaningful Bible verses about {keyword} and understand their spiritual
        significance in daily life.
      </p>

      <h2>Top Bible Verses About {keywordCapitalized}</h2>

      <p>
        <Link href="/bible/james/1/" style={{ color: '#b8860b', textDecoration: 'none', fontWeight: '600' }}>James 1:3</Link>
        {' '}&ndash; Because you know that the testing of your faith produces perseverance.
      </p>
      <p>
        <Link href="/bible/romans/12/" style={{ color: '#b8860b', textDecoration: 'none', fontWeight: '600' }}>Romans 12:12</Link>
        {' '}&ndash; Be joyful in hope, patient in affliction, faithful in prayer.
      </p>
      <p>
        <Link href="/bible/hebrews/10/" style={{ color: '#b8860b', textDecoration: 'none', fontWeight: '600' }}>Hebrews 10:36</Link>
        {' '}&ndash; You need to persevere so that when you have done the will of God, you will receive what he has promised.
      </p>

      <div style={{ margin: '2rem 0', padding: '1rem 1.5rem', background: '#f9f5ee', border: '1px solid #e8dfc8', borderRadius: '0.75rem' }}>
        <strong style={{ color: '#1e2d4a' }}>Read this also:</strong>
        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
          <li>
            <Link href={`/topics/${topicSlug}/`} style={{ color: '#b8860b', textDecoration: 'none' }}>
              A deeper look at {keyword} in Christian faith
            </Link>
          </li>
        </ul>
      </div>

      <h2>Meaning of {keywordCapitalized} in the Bible</h2>
      <p>
        The Bible teaches that {keyword} is an important spiritual quality that helps
        believers grow in faith and trust God through every season of life.
      </p>

      <h2>Why is {keywordCapitalized} Important?</h2>
      <p>
        Understanding {keyword} helps strengthen your relationship with God and
        guides your daily decisions and actions.
      </p>

      <h2>How to Practice {keywordCapitalized}</h2>
      <p>
        Through prayer, reflection on scripture, and trust in God, you can develop
        {' '}{keyword} in your life each day.
      </p>

      <h2>Conclusion</h2>
      <p>
        Bible verses about {keyword} provide guidance, encouragement, and wisdom
        for everyday challenges. Let scripture be your guide.
      </p>

      <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e8dfc8' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', color: '#1e2d4a', marginBottom: '1rem' }}>Relevant Articles</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>
            <Link href={`/topics/${topicSlug}/`} style={{ color: '#b8860b', textDecoration: 'none' }}>
              Understanding {keyword} in Christian life →
            </Link>
          </li>
          <li>
            <Link href="/questions/" style={{ color: '#b8860b', textDecoration: 'none' }}>
              Explore spiritual questions about faith →
            </Link>
          </li>
          <li>
            <Link href="/guides/" style={{ color: '#b8860b', textDecoration: 'none' }}>
              Start a Bible study guide →
            </Link>
          </li>
          <li>
            <Link href="/topics/" style={{ color: '#b8860b', textDecoration: 'none' }}>
              Browse all Bible topics →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
