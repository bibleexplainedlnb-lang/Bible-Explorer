import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Bible Verse Insight",
  description:
    "Explore Bible verses with deep insights, meanings, explanations, and study guides to understand scripture better.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#faf7f2", color: "#1a1208" }}
      >
        <header style={{ backgroundColor: "#1e2d4a" }} className="shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href="/"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>✝</span>
              <span
                style={{
                  color: "#d4a017",
                  fontFamily: "Georgia, serif",
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  letterSpacing: "0.02em",
                }}
              >
                Bible Verse Insights
              </span>
            </Link>
            <nav
              style={{
                display: "flex",
                gap: "0.25rem",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {[
                { href: "/topics", label: "Topics" },
                { href: "/questions", label: "Questions" },
                { href: "/guides", label: "Guides" },
                { href: "/bible/john/1", label: "Read Bible" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    color: "#c8b99a",
                    padding: "0.35rem 0.85rem",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    textDecoration: "none",
                    transition: "background-color 0.15s",
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main style={{ flex: 1 }}>{children}</main>

        <footer
          style={{
            backgroundColor: "#1e2d4a",
            color: "#8b9bb4",
            padding: "2rem 0",
            marginTop: "4rem",
          }}
        >
          <div
            style={{
              maxWidth: "72rem",
              margin: "0 auto",
              padding: "0 1rem",
              textAlign: "center",
              fontSize: "0.875rem",
            }}
          >
            <p
              style={{
                color: "#d4a017",
                marginBottom: "0.5rem",
                fontFamily: "Georgia, serif",
                fontSize: "1rem",
              }}
            >
              ✝ Bible Verse Insights
            </p>
            <p>
              KJV Scripture text via{" "}
              <a
                href="https://bible-api.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#a0b0c8" }}
              >
                bible-api.com
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
