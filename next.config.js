/** @type {import('next').NextConfig} */
const replitDomain = process.env.REPLIT_DEV_DOMAIN;

const nextConfig = {
  trailingSlash: true,
  async redirects() {
    // Old -2 slug URLs → correct /bible-verses/ paths
    // Both with and without trailing slash are listed because trailingSlash:true normalises AFTER redirects
    const slugPairs = [
      ['bible-verses-about-christian-living-2', 'bible-verses-about-christian-living'],
      ['bible-verses-about-encouragement-2',    'bible-verses-about-encouragement'],
      ['bible-verses-about-being-born-again-2', 'bible-verses-about-being-born-again'],
      ['bible-verses-about-anxiety-2',          'bible-verses-about-anxiety'],
      ['bible-verses-about-being-thankful-2',   'bible-verses-about-being-thankful'],
    ];
    return slugPairs.flatMap(([old, next]) => [
      { source: `/guides/${old}`,  destination: `/bible-verses/${next}`, permanent: true },
      { source: `/guides/${old}/`, destination: `/bible-verses/${next}`, permanent: true },
    ]);
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@prisma/client', 'prisma'],
  },
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    ...(replitDomain ? [replitDomain, `*.${replitDomain.split('.').slice(1).join('.')}`] : []),
    '*.picard.replit.dev',
    '*.replit.dev',
  ],
}

module.exports = nextConfig
