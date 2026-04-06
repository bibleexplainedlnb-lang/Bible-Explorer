export function generateMetadata({ params }) {
  const keyword = params.keyword.replaceAll('-', ' ');

  return {
    title: `Bible Verses About ${keyword}`,
    description: `Discover powerful Bible verses about ${keyword} with meaning and explanation.`,
  };
}

export default function Page({ params }) {
  const keyword = params.keyword.replaceAll('-', ' ');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Bible Verses About {keyword}</h1>

      <p>
        Explore meaningful Bible verses about {keyword} and understand their spiritual significance in daily life.
      </p>

      <h2>Top Bible Verses About {keyword}</h2>

      <p><strong>James 1:3</strong> &ndash; Because you know that the testing of your faith produces perseverance.</p>
      <p><strong>Romans 12:12</strong> &ndash; Be joyful in hope, patient in affliction, faithful in prayer.</p>

      <h2>Meaning of {keyword} in the Bible</h2>
      <p>
        The Bible teaches that {keyword} is an important spiritual quality that helps believers grow in faith.
      </p>

      <h2>Why is {keyword} important?</h2>
      <p>
        Understanding {keyword} helps strengthen your relationship with God and guides your daily life.
      </p>

      <h2>How to practice {keyword}</h2>
      <p>
        Through prayer, reflection, and trust in God, you can develop {keyword} in your life.
      </p>

      <h2>Conclusion</h2>
      <p>
        Bible verses about {keyword} provide guidance, encouragement, and wisdom for everyday challenges.
      </p>
    </div>
  );
}
