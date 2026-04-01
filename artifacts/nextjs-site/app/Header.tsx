"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBar from "./SearchBar";

const NAV_LINKS = [
  { label: "Questions", href: "/questions/what-is-salvation" },
  { label: "Topics",    href: "/topics/salvation"            },
  { label: "Guides",    href: "/guides/understanding-salvation" },
  { label: "Bible",     href: "/bible/genesis/1"             },
];

function isActive(pathname: string, href: string): boolean {
  const section = href.split("/")[1];
  return pathname.startsWith(`/${section}`);
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Faith &amp; Scripture
          </Link>

          {/* Desktop search — grows to fill space */}
          <div className="hidden sm:block flex-1 max-w-xs">
            <SearchBar onNavigate={() => setMenuOpen(false)} />
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 flex-shrink-0 ml-auto">
            {NAV_LINKS.map(({ label, href }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={label}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            className="sm:hidden ml-auto flex flex-col items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors gap-[5px]"
          >
            <span className={`block h-0.5 w-5 bg-gray-700 rounded-full transition-all duration-200 origin-center ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block h-0.5 w-5 bg-gray-700 rounded-full transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-gray-700 rounded-full transition-all duration-200 origin-center ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-3 space-y-3">
          {/* Search inside mobile menu */}
          <SearchBar onNavigate={() => setMenuOpen(false)} />

          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ label, href }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
