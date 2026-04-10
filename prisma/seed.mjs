import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------
const TOPICS = [
  {
    name: 'Bible Basics',
    slug: 'bible-basics',
    description: 'Practical guidance for anyone new to reading and studying the Bible.',
  },
  {
    name: 'Faith',
    slug: 'faith',
    description: 'Explore what Scripture teaches about trust, belief, and walking in faith with God. Faith is the foundation of the Christian life — the assurance of things hoped for and the conviction of things not seen.',
  },
  {
    name: 'Grace',
    slug: 'grace',
    description: "Grace is God's unmerited favor — the gift we could never earn. Explore how grace runs through the entire biblical narrative and transforms our lives.",
  },
  {
    name: 'Salvation',
    slug: 'salvation',
    description: "Understand God's redemptive plan for humanity. Salvation is the free gift of God through Jesus Christ — forgiveness of sin and the promise of eternal life.",
  },
  {
    name: 'Prayer',
    slug: 'prayer',
    description: "Discover the practice and power of prayer. From the Lord's Prayer to Paul's instructions, the Bible has much to say about how, when, and why we talk to God.",
  },
];

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------
const QUESTIONS = [
  {
    title: 'How do I start reading the Bible?',
    slug: 'how-to-start-reading-bible',
    topicSlug: 'bible-basics',
    summary: 'A practical step-by-step guide for first-time Bible readers — where to begin, which translation to use, and how to build a consistent reading habit.',
    metaTitle: 'How to Start Reading the Bible — A Practical Guide for Beginners',
    metaDescription: 'Not sure where to begin in the Bible? Start with the Gospel of John, read the Psalms daily, and choose a modern translation. Step-by-step guidance for new readers.',
    keywords: ['how to read the Bible', 'Bible for beginners', 'start reading the Bible', 'Gospel of John', 'Bible translations'],
    relatedSlugs: ['what-is-faith', 'how-should-christians-pray', 'what-is-grace'],
    contentHtml: `<p>Starting the Bible for the first time can feel overwhelming — it is a library of 66 books spanning thousands of years. Here is a practical approach to get started.</p>
<p><strong>Begin with the Gospel of John.</strong> John is widely recommended as the best starting point for new readers. It tells the story of Jesus in clear, beautiful prose, addresses the big questions of meaning and eternal life, and is written explicitly so 'that you may believe that Jesus is the Christ, the Son of God' (John 20:31).</p>
<p><strong>Then read the rest of the Gospels.</strong> Matthew, Mark, and Luke each give a different perspective on Jesus\u2019 life, ministry, death, and resurrection. Understanding Jesus is the key to understanding the whole Bible.</p>
<p><strong>Move to Acts and the Letters.</strong> Acts tells the story of the early church. The letters of Paul, Peter, and John explain how to live as a follower of Jesus.</p>
<p><strong>Read the Psalms alongside everything else.</strong> One Psalm a day will nourish your prayer life and give you language to bring your emotions to God.</p>
<p><strong>Use a modern translation.</strong> The ESV, NIV, CSB, or NLT are all excellent. The KJV is majestic and historically important, but a modern translation may be easier for daily reading.</p>
<p><strong>Approach with prayer.</strong> Before reading, ask God to open your eyes (Psalm 119:18). The Bible is not just literature \u2014 it is the living Word of God (Hebrews 4:12).</p>
<p><strong>Key verses:</strong></p>
<ul><li>2 Timothy 3:16\u201317 \u2014 Scripture is inspired</li><li>Psalm 119:105 \u2014 A lamp to my feet</li><li>Hebrews 4:12 \u2014 The Word is living and active</li><li>Joshua 1:8 \u2014 Meditate on it day and night</li></ul>`,
  },
  {
    title: 'What is faith according to the Bible?',
    slug: 'what-is-faith',
    topicSlug: 'faith',
    summary: "Faith is confident trust in God and His promises — not blind belief, but assurance grounded in God's revealed character and Word.",
    metaTitle: 'What Is Faith? The Biblical Definition of Faith Explained',
    metaDescription: "Faith in the Bible means confident trust in God and His promises. Learn what Hebrews 11:1 teaches about faith, and how the 'Hall of Faith' shows faith in action.",
    keywords: ['what is faith', 'biblical faith', 'faith in the Bible', 'Hebrews 11', 'faith and works'],
    relatedSlugs: ['what-is-grace', 'how-to-start-reading-bible', 'how-should-christians-pray'],
    contentHtml: `<p>The Bible gives us a clear definition of faith in Hebrews 11:1: 'Now faith is the substance of things hoped for, the evidence of things not seen.' Faith, in the biblical sense, is not blind belief \u2014 it is confident trust grounded in who God is and what He has revealed.</p>
<p>Faith is closely tied to trust. Proverbs 3:5\u20136 calls us to 'trust in the LORD with all your heart and lean not on your own understanding.' Romans 10:17 tells us that 'faith comes by hearing, and hearing by the word of God.' This means our faith grows as we engage with Scripture.</p>
<p>The famous 'Hall of Faith' in Hebrews 11 describes men and women throughout history who acted on their belief in God\u2019s promises \u2014 from Noah building the ark to Abraham leaving his homeland to Moses leading the Israelites. Their faith was demonstrated through action.</p>
<p>James reinforces this in James 2:17 when he writes that 'faith without works is dead.' A living, saving faith will produce fruit \u2014 obedience, love, and a changed life.</p>
<p><strong>Key verses:</strong></p>
<ul><li>Hebrews 11:1 \u2014 Definition of faith</li><li>Romans 10:17 \u2014 Faith comes from hearing</li><li>James 2:17 \u2014 Faith without works is dead</li><li>Proverbs 3:5\u20136 \u2014 Trust in the Lord</li></ul>`,
  },
  {
    title: 'What is grace and how does it work?',
    slug: 'what-is-grace',
    topicSlug: 'grace',
    summary: "Grace is God's unmerited favor — salvation and transformation freely given through Jesus Christ, not earned by human effort.",
    metaTitle: "What Is Grace? God's Unmerited Favor Explained from Scripture",
    metaDescription: "Grace means receiving from God what we could never earn. Explore Ephesians 2:8-9 and how grace saves, transforms, and sustains every believer's life.",
    keywords: ['what is grace', 'grace in the Bible', 'unmerited favor', 'Ephesians 2:8', 'saved by grace'],
    relatedSlugs: ['what-is-faith', 'who-is-the-holy-spirit', 'how-to-start-reading-bible'],
    contentHtml: `<p>Grace is one of the most important words in the Bible. At its core, grace means unmerited favor \u2014 receiving something good that we have not earned and do not deserve. While the law reveals what we should be, grace provides what we cannot achieve on our own.</p>
<p>Grace appears throughout the Old Testament (the Hebrew word 'hesed' meaning steadfast love), but it reaches its fullest expression in Jesus Christ. John 1:17 says, 'For the law was given through Moses; grace and truth came through Jesus Christ.'</p>
<p>Salvation is entirely a work of grace. Ephesians 2:8\u20139 is the classic text: 'For by grace you have been saved through faith. And this is not your own doing; it is the gift of God.' We cannot earn, buy, or merit salvation \u2014 it is freely given.</p>
<p>But grace does more than save us \u2014 it transforms us. Titus 2:11\u201312 says grace 'trains us to renounce ungodliness and worldly passions, and to live self-controlled, upright, and godly lives.' Grace is not a license to sin (Romans 6:1\u20132) \u2014 it is the power to live differently.</p>
<p>2 Corinthians 12:9 records Jesus telling Paul, 'My grace is sufficient for you, for my power is made perfect in weakness.' Grace meets us in our deepest weakness.</p>
<p><strong>Key verses:</strong></p>
<ul><li>Ephesians 2:8\u20139 \u2014 Saved by grace</li><li>2 Corinthians 12:9 \u2014 Grace in weakness</li><li>Romans 5:20 \u2014 Where sin increased, grace abounded</li><li>Titus 2:11 \u2014 Grace that trains us</li></ul>`,
  },
  {
    title: 'Who is the Holy Spirit?',
    slug: 'who-is-the-holy-spirit',
    topicSlug: 'salvation',
    summary: 'The Holy Spirit is the third person of the Trinity — fully God, indwelling every believer to convict, guide, empower, and transform.',
    metaTitle: 'Who Is the Holy Spirit? A Biblical Guide to the Third Person of the Trinity',
    metaDescription: 'The Holy Spirit is fully God — not a force, but a person. Discover the Spirit\'s roles in Scripture: Helper, Comforter, Intercessor, and Fruit-producer (Galatians 5:22).',
    keywords: ['who is the Holy Spirit', 'Holy Spirit in the Bible', 'fruit of the Spirit', 'Trinity', 'Pentecost Acts 2'],
    relatedSlugs: ['what-is-grace', 'what-is-faith', 'how-should-christians-pray'],
    contentHtml: `<p>The Holy Spirit is the third person of the Trinity \u2014 fully God, co-equal with the Father and the Son. He is not an impersonal force but a personal being with a mind (Romans 8:27), will (1 Corinthians 12:11), and emotions (Ephesians 4:30).</p>
<p>In the Old Testament, the Spirit of God hovered over the waters at creation (Genesis 1:2), empowered leaders and prophets (Judges 3:10, Isaiah 61:1), and was promised to be poured out on all people (Joel 2:28).</p>
<p>At Pentecost (Acts 2), this promise was fulfilled. The Spirit was poured out on all believers, not just special leaders. Since then, every person who believes in Jesus receives the Holy Spirit (Ephesians 1:13\u201314).</p>
<p>The Spirit performs many roles in our lives. He convicts us of sin (John 16:8), guides us into truth (John 16:13), intercedes for us in prayer (Romans 8:26), produces the fruit of a transformed character (Galatians 5:22\u201323), gifts us for ministry (1 Corinthians 12), and assures us that we are God\u2019s children (Romans 8:16).</p>
<p>Jesus called the Spirit the 'Helper' or 'Paraclete' \u2014 one who comes alongside (John 14:16). The Spirit is our constant companion, teacher, and empowerer.</p>
<p><strong>Key verses:</strong></p>
<ul><li>John 14:16\u201317 \u2014 The Spirit as Helper</li><li>Acts 2:38 \u2014 Receive the Holy Spirit</li><li>Galatians 5:22\u201323 \u2014 Fruit of the Spirit</li><li>Romans 8:26 \u2014 The Spirit intercedes</li></ul>`,
  },
  {
    title: 'How should Christians pray?',
    slug: 'how-should-christians-pray',
    topicSlug: 'prayer',
    summary: "Jesus modeled prayer in the Lord's Prayer — approaching God as Father, aligning with His will, and persisting with faith.",
    metaTitle: "How Should Christians Pray? What Jesus Taught About Prayer",
    metaDescription: "Learn how to pray from Jesus himself. The Lord's Prayer in Matthew 6 shows us to worship, submit, petition, and persist — with God as our Father.",
    keywords: ['how to pray', "Lord's Prayer", 'Christian prayer', 'Matthew 6', 'pray without ceasing'],
    relatedSlugs: ['how-to-start-reading-bible', 'what-is-faith', 'who-is-the-holy-spirit'],
    contentHtml: `<p>Jesus gave us the clearest model for prayer in Matthew 6:9\u201313, known as the Lord\u2019s Prayer. It opens with worship ('Our Father in heaven, hallowed be your name'), moves to submission ('your kingdom come, your will be done'), then to petition (daily bread, forgiveness, deliverance), and closes with praise.</p>
<p>This model teaches us several things about prayer:</p>
<p><strong>1. Approach God as Father.</strong> Prayer is not a ritual \u2014 it is a conversation with a loving Father. Jesus called God 'Abba' (Romans 8:15), an intimate term meaning Father or Daddy.</p>
<p><strong>2. Align your will with His.</strong> Jesus modeled this in Gethsemane: 'not my will, but yours, be done' (Luke 22:42). Prayer is not about bending God\u2019s will to ours \u2014 it is about aligning ourselves with His purposes.</p>
<p><strong>3. Be persistent.</strong> In Luke 18:1, Jesus told a parable to show that we 'ought always to pray and not lose heart.' Paul echoes this in 1 Thessalonians 5:17: 'pray without ceasing.'</p>
<p><strong>4. Pray with faith.</strong> Mark 11:24 says, 'Whatever you ask in prayer, believe that you have received it, and it will be yours.'</p>
<p><strong>5. Pray in the Spirit.</strong> Ephesians 6:18 calls us to pray 'at all times in the Spirit, with all prayer and supplication.'</p>
<p><strong>Key verses:</strong></p>
<ul><li>Matthew 6:9\u201313 \u2014 The Lord\u2019s Prayer</li><li>Philippians 4:6 \u2014 Present your requests to God</li><li>1 Thessalonians 5:17 \u2014 Pray without ceasing</li><li>James 5:16 \u2014 The prayer of a righteous person is powerful</li></ul>`,
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function main() {
  console.log('Seeding database...\n');

  // 1. Upsert all topics first, build slug → id map
  const topicMap = {};
  for (const t of TOPICS) {
    const topic = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { name: t.name, description: t.description },
      create: { name: t.name, slug: t.slug, description: t.description },
    });
    topicMap[t.slug] = topic.id;
    console.log(`  topic    \u2713  "${topic.name}" (id ${topic.id})`);
  }

  console.log('');

  // 2. Upsert all questions with full SEO metadata
  for (const q of QUESTIONS) {
    const topicId = topicMap[q.topicSlug];
    const question = await prisma.question.upsert({
      where: { slug: q.slug },
      update: {
        title: q.title,
        contentHtml: q.contentHtml,
        summary: q.summary,
        metaTitle: q.metaTitle,
        metaDescription: q.metaDescription,
        keywords: q.keywords,
        relatedSlugs: q.relatedSlugs,
        topicId,
      },
      create: {
        title: q.title,
        slug: q.slug,
        contentHtml: q.contentHtml,
        summary: q.summary,
        metaTitle: q.metaTitle,
        metaDescription: q.metaDescription,
        keywords: q.keywords,
        relatedSlugs: q.relatedSlugs,
        topicId,
      },
    });
    console.log(`  question \u2713  "${question.title}"`);
    console.log(`           keywords: ${question.keywords.join(', ')}`);
    console.log(`           related:  ${question.relatedSlugs.join(', ')}`);
  }

  console.log('\nSeed complete.');
}

main()
  .catch((e) => {
    console.error('\nSeed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
