/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "*.replit.dev",
    "*.picard.replit.dev",
    "*.spock.replit.dev",
    "*.repl.co",
  ],
};

module.exports = nextConfig;
