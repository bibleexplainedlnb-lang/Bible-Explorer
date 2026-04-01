import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone mode bundles only the files needed to run, without node_modules.
  // Great for Docker / cloud deployments. Remove this line if you prefer
  // a standard `next start` setup.
  output: "standalone",

  // Allow the dev server to be embedded in cross-origin iframes (e.g. Replit).
  // Safe to remove in production or when running locally.
  allowedDevOrigins: ["*"],
};

export default nextConfig;
