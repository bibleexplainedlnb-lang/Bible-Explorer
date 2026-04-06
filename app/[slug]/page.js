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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Bible Verses About {keyword}</h1>

      <p>
        Explore meaningful Bible verses about {keyword} and understand their spiritual
        significance in daily life.
      </p>

      <h2>Top Bible Verses About {keyword}</h2>

      <p><strong>James 1:3</strong> &ndash; Because you know that the testing of your faith produces perseverance.</p>
      <p><strong>Romans 12:12</strong> &ndash; Be joyful in hope, patient in affliction, faithful in prayer.</p>
      <p><strong>Hebrews 10:36</strong> &ndash; You need to persevere so that when you have done the will of God, you will receive what he has promised.</p>

      <h2>Meaning of {keyword} in the Bible</h2>
      <p>
        The Bible teaches that {keyword} is an important spiritual quality that helps
        believers grow in faith and trust God through every season of life.
      </p>

      <h2>Why is {keyword} important?</h2>
      <p>
        Understanding {keyword} helps strengthen your relationship with God and
        guides your daily decisions and actions.
      </p>

      <h2>How to practice {keyword}</h2>
      <p>
        Through prayer, reflection on scripture, and trust in God, you can develop
        {' '}{keyword} in your life each day.
      </p>

      <h2>Conclusion</h2>
      <p>
        Bible verses about {keyword} provide guidance, encouragement, and wisdom
        for everyday challenges. Let scripture be your guide.
      </p>
    </div>
  );
}
