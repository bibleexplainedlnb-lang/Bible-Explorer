import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONTENT_HTML = `<p>Starting the Bible for the first time can feel overwhelming — it is a library of 66 books spanning thousands of years. Here is a practical approach to get started.</p>
<p><strong>Begin with the Gospel of John.</strong> John is widely recommended as the best starting point for new readers. It tells the story of Jesus in clear, beautiful prose, addresses the big questions of meaning and eternal life, and is written explicitly so 'that you may believe that Jesus is the Christ, the Son of God' (John 20:31).</p>
<p><strong>Then read the rest of the Gospels.</strong> Matthew, Mark, and Luke each give a different perspective on Jesus\u2019 life, ministry, death, and resurrection. Understanding Jesus is the key to understanding the whole Bible.</p>
<p><strong>Move to Acts and the Letters.</strong> Acts tells the story of the early church. The letters of Paul, Peter, and John explain how to live as a follower of Jesus.</p>
<p><strong>Read the Psalms alongside everything else.</strong> One Psalm a day will nourish your prayer life and give you language to bring your emotions to God.</p>
<p><strong>Use a modern translation.</strong> The ESV, NIV, CSB, or NLT are all excellent. The KJV is majestic and historically important, but a modern translation may be easier for daily reading.</p>
<p><strong>Approach with prayer.</strong> Before reading, ask God to open your eyes (Psalm 119:18). The Bible is not just literature \u2014 it is the living Word of God (Hebrews 4:12).</p>
<p><strong>Key verses:</strong></p>
<ul><li>2 Timothy 3:16\u201317 \u2014 Scripture is inspired</li><li>Psalm 119:105 \u2014 A lamp to my feet</li><li>Hebrews 4:12 \u2014 The Word is living and active</li><li>Joshua 1:8 \u2014 Meditate on it day and night</li></ul>`;

async function main() {
  console.log('Seeding database...');

  // 1. Upsert the topic (safe to re-run)
  const topic = await prisma.topic.upsert({
    where: { slug: 'bible-basics' },
    update: {
      name: 'Bible Basics',
      description: 'Practical guidance for anyone new to reading and studying the Bible.',
    },
    create: {
      name: 'Bible Basics',
      slug: 'bible-basics',
      description: 'Practical guidance for anyone new to reading and studying the Bible.',
    },
  });

  console.log(`Topic upserted: "${topic.name}" (id: ${topic.id})`);

  // 2. Upsert the question linked to the topic
  const question = await prisma.question.upsert({
    where: { slug: 'how-to-start-reading-bible' },
    update: {
      title: 'How do I start reading the Bible?',
      contentHtml: CONTENT_HTML,
      summary: 'A practical step-by-step guide for first-time Bible readers — where to begin, which translation to use, and how to build a consistent reading habit.',
      topicId: topic.id,
    },
    create: {
      title: 'How do I start reading the Bible?',
      slug: 'how-to-start-reading-bible',
      contentHtml: CONTENT_HTML,
      summary: 'A practical step-by-step guide for first-time Bible readers — where to begin, which translation to use, and how to build a consistent reading habit.',
      topicId: topic.id,
    },
  });

  console.log(`Question upserted: "${question.title}" (id: ${question.id})`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
