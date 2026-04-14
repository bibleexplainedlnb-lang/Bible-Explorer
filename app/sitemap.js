export const dynamic = 'force-dynamic';

import { topics, questions, guides } from '../lib/db.js';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bibleverseinsights.com';

const KEY_BIBLE_CHAPTERS = [
  ['john', 1], ['john', 3], ['john', 14], ['john', 15],
  ['psalms', 1], ['psalms', 23], ['psalms', 119],
  ['romans', 5], ['romans', 8], ['romans', 12],
  ['matthew', 5], ['matthew', 6], ['matthew', 7],
  ['genesis', 1], ['genesis', 3],
  ['1corinthians', 13], ['1corinthians', 15],
  ['ephesians', 2], ['ephesians', 6],
  ['philippians', 4],
  ['hebrews', 11],
  ['james', 1],
  ['proverbs', 3], ['proverbs', 31],
  ['isaiah', 40], ['isaiah', 53],
];

export default function sitemap() {
  const allTopics = topics.list();
  const allQuestions = questions.list();
  const allGuides = guides.list();

  const staticPages = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/topics/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/questions/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/guides/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/bible/john/1/`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  const topicPages = allTopics.map((t) => ({
    url: `${SITE_URL}/topics/${t.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  const questionPages = allQuestions.map((q) => ({
    url: `${SITE_URL}/questions/${q.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const guidePages = allGuides.map((g) => ({
    url: `${SITE_URL}/guides/${g.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  const keywordPages = allTopics.map((t) => ({
    url: `${SITE_URL}/bible-verses-about-${t.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  const biblePages = KEY_BIBLE_CHAPTERS.map(([book, chapter]) => ({
    url: `${SITE_URL}/bible/${book}/${chapter}/`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...topicPages,
    ...questionPages,
    ...guidePages,
    ...keywordPages,
    ...biblePages,
  ];
}
