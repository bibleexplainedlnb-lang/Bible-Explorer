import type { Metadata } from "next";
import Header from "./Header";
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
        <Header />
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
