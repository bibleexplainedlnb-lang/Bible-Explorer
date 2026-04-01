import { topics as tdb } from "@/lib/db";
import { addQuestion } from "./actions";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export const metadata = { title: "Admin | Faith & Scripture" };

export default async function AdminPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const allTopics = tdb.list();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin</h1>
      <p className="text-sm text-gray-500 mb-8">Add a new question to the database.</p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={addQuestion} className="space-y-5">
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
            placeholder="e.g. What is grace?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            placeholder="e.g. what-is-grace"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
          <p className="mt-1 text-xs text-gray-400">
            Lowercase letters, numbers, and hyphens only. Used in the URL: /questions/<em>slug</em>
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
            {allTopics.map((t) => (
              <option key={t.slug} value={t.name} />
            ))}
          </datalist>
          {allTopics.length > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              Existing: {allTopics.map((t) => t.name).join(", ")}
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

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Question
          </button>
        </div>
      </form>
    </div>
  );
}
