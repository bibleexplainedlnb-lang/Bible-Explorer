import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Faith & Scripture",
  description: "Explore questions, topics, guides, and the Bible",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link
                href="/"
                className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                Faith &amp; Scripture
              </Link>
              <nav className="flex items-center gap-6">
                <Link
                  href="/"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/questions/what-is-faith"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Questions
                </Link>
                <Link
                  href="/topics/faith"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Topics
                </Link>
                <Link
                  href="/bible/genesis/1"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Bible
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-16">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-sm text-gray-500 text-center">
              &copy; {new Date().getFullYear()} Faith &amp; Scripture. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
