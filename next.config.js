/** @type {import('next').NextConfig} */
const replitDomain = process.env.REPLIT_DEV_DOMAIN;

const nextConfig = {
  trailingSlash: true,
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
