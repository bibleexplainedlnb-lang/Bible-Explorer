"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { addQuestion, checkSlugAvailable } from "./actions";

interface Props {
  existingTopics: string[];
  error?: string;
}

/** Convert a title string into a URL-safe slug */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // strip accents
    .replace(/[^a-z0-9\s-]/g, "")      // keep only alphanum, spaces, hyphens
    .replace(/\s+/g, "-")              // spaces → hyphens
    .replace(/-+/g, "-")               // collapse multiple hyphens
    .replace(/^-+|-+$/g, "");          // trim leading/trailing hyphens
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function AdminForm({ existingTopics, error }: Props) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  // Track whether user has manually edited the slug
  const slugManualRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();

  // Auto-generate slug from title (only when not manually edited)
  useEffect(() => {
    if (!slugManualRef.current) {
      setSlug(slugify(title));
    }
  }, [title]);

  // Debounced slug availability check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!slug) {
      setSlugStatus("idle");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const available = await checkSlugAvailable(slug);
        setSlugStatus(available ? "available" : "taken");
      });
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [slug]);

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    slugManualRef.current = true;
    setSlug(e.target.value);
  }

  // If the user clears the slug field entirely, re-enable auto-generation
  function handleSlugBlur() {
    if (!slug) {
      slugManualRef.current = false;
      setSlug(slugify(title));
    }
  }

  const slugIndicator: Record<SlugStatus, { icon: string; text: string; color: string }> = {
    idle:      { icon: "",  text: "",                     color: "" },
    checking:  { icon: "⋯", text: "Checking…",            color: "text-gray-400" },
    available: { icon: "✓", text: "Available",            color: "text-green-600" },
    taken:     { icon: "✕", text: "Already exists",       color: "text-red-600" },
    invalid:   { icon: "!", text: "Invalid format",        color: "text-amber-600" },
  };

  const { icon, text, color } = slugIndicator[slugStatus];

  const canSubmit =
    title.trim() !== "" &&
    slug.trim() !== "" &&
    slugStatus === "available" &&
    !isPending;

  return (
    <form action={addQuestion} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. What is grace?"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
          Slug <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={handleSlugChange}
            onBlur={handleSlugBlur}
            placeholder="auto-generated from title"
            className={`w-full rounded-lg border px-3 py-2 pr-28 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-colors ${
              slugStatus === "available"
                ? "border-green-400 focus:border-green-500 focus:ring-green-500"
                : slugStatus === "taken" || slugStatus === "invalid"
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
          />
          {slugStatus !== "idle" && (
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${color} flex items-center gap-1 pointer-events-none`}>
              {icon} {text}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Auto-generated from title. Edit to override. Used as: /questions/<em>slug</em>
        </p>
      </div>

      {/* Topic */}
      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
          Topic
        </label>
        <input
          id="topic"
          name="topic"
          type="text"
          list="topics-list"
          placeholder="e.g. Salvation"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <datalist id="topics-list">
          {existingTopics.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        {existingTopics.length > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            Existing: {existingTopics.join(", ")}
          </p>
        )}
      </div>

      {/* Short Answer */}
      <div>
        <label htmlFor="shortAnswer" className="block text-sm font-medium text-gray-700 mb-1">
          Short Answer
        </label>
        <input
          id="shortAnswer"
          name="shortAnswer"
          type="text"
          placeholder="A one-sentence answer shown as a summary"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Content */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          id="content"
          name="content"
          rows={10}
          placeholder="Full question content. HTML is supported (e.g. <p>, <h2>, <strong>)."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y font-mono leading-relaxed"
        />
        <p className="mt-1 text-xs text-gray-400">HTML is rendered as-is on the question page.</p>
      </div>

      <div className="pt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : "Save Question"}
        </button>
        {slugStatus === "taken" && (
          <p className="text-xs text-red-600">
            Change the slug — a question with this URL already exists.
          </p>
        )}
      </div>
    </form>
  );
}
