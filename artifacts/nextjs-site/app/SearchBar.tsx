"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import data from "@/data/content.json";

type ResultType = "question" | "topic" | "guide";

interface Result {
  type: ResultType;
  title: string;
  description: string;
  href: string;
}

/* Build index once at module load (bundled at build time — no backend needed) */
const INDEX: Result[] = [
  ...data.questions.map((q) => ({
    type: "question" as const,
    title: q.title,
    description: q.shortAnswer ?? "",
    href: `/questions/${q.slug}`,
  })),
  ...(data.topics as { slug: string; name: string }[]).map((t) => ({
    type: "topic" as const,
    title: t.name,
    description: "",
    href: `/topics/${t.slug}`,
  })),
  ...(data.guides as { slug: string; title: string; shortDescription: string }[]).map((g) => ({
    type: "guide" as const,
    title: g.title,
    description: g.shortDescription ?? "",
    href: `/guides/${g.slug}`,
  })),
];

function runSearch(query: string): Result[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return INDEX.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
  ).slice(0, 7);
}

const TYPE_STYLES: Record<ResultType, { label: string; className: string }> = {
  question: { label: "Q", className: "bg-blue-100 text-blue-700" },
  topic:    { label: "T", className: "bg-violet-100 text-violet-700" },
  guide:    { label: "G", className: "bg-amber-100 text-amber-700" },
};

interface Props {
  onNavigate?: () => void;
  className?: string;
}

export default function SearchBar({ onNavigate, className = "" }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const results = runSearch(query);

  /* Close on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActive(-1);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Close on route change */
  useEffect(() => {
    setOpen(false);
    setQuery("");
    setActive(-1);
  }, [pathname]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    setActive(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      inputRef.current?.blur();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter" && active >= 0 && results[active]) {
      e.preventDefault();
      navigate(results[active].href);
    }
  }

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    setActive(-1);
    onNavigate?.();
    router.push(href);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search…"
          autoComplete="off"
          onChange={handleInput}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <ul>
            {results.map((r, i) => {
              const badge = TYPE_STYLES[r.type];
              const isActive = i === active;
              return (
                <li key={r.href}>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); navigate(r.href); }}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? "bg-amber-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Type badge */}
                    <span className={`flex-shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${badge.className}`}>
                      {badge.label}
                    </span>
                    {/* Text */}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-900 truncate">
                        {r.title}
                      </span>
                      {r.description && (
                        <span className="block text-xs text-gray-500 truncate mt-0.5">
                          {r.description}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] text-gray-400">
              <span className="inline-flex items-center gap-2">
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold ${TYPE_STYLES.question.className}`}>Q</span> Question
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold ${TYPE_STYLES.topic.className}`}>T</span> Topic
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold ${TYPE_STYLES.guide.className}`}>G</span> Guide
              </span>
            </p>
          </div>
        </div>
      )}

      {/* No results */}
      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-gray-200 bg-white shadow-lg px-4 py-4 text-center">
          <p className="text-sm text-gray-500">No results for <strong>&ldquo;{query}&rdquo;</strong></p>
        </div>
      )}
    </div>
  );
}
