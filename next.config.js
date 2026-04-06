/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  trailingSlash: true,
  serverExternalPackages: ['better-sqlite3'],
  allowedDevOrigins: [
    "*.replit.dev",
    "*.picard.replit.dev",
    "*.spock.replit.dev",
    "*.repl.co",
  ],
};

module.exports = nextConfig;
