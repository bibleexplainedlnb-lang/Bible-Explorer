/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@prisma/client', 'prisma'],
  },
  allowedDevOrigins: ['*'],
}

module.exports = nextConfig
