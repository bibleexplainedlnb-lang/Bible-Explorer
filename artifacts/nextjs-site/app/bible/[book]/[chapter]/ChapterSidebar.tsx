"use client";

interface Section {
  title: string;
  content: string;
  defaultOpen?: boolean;
}

const sections: Section[] = [
  {
    title: "Chapter Summary",
    defaultOpen: true,
    content:
      "A brief summary of this chapter will appear here, giving an overview of the main narrative, teaching, or events recorded.",
  },
  {
    title: "Key Themes",
    content:
      "The central themes running through this chapter — such as faith, redemption, covenant, or grace — will be highlighted here to help orient your reading.",
  },
  {
    title: "Simple Explanation",
    content:
      "A plain-language explanation of what this chapter means and why it matters, written for anyone encountering it for the first time.",
  },
];

export default function ChapterSidebar() {
  return (
    <div className="lg:sticky lg:top-8 space-y-2">
      {sections.map((section) => (
        <details
          key={section.title}
          open={section.defaultOpen}
          className="group rounded-lg border border-gray-200 bg-gray-50 overflow-hidden"
        >
          <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none list-none hover:bg-gray-100 transition-colors">
            <span className="text-sm font-semibold text-gray-700">
              {section.title}
            </span>
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-4 pb-4 pt-1">
            <p className="text-sm text-gray-500 leading-relaxed italic">
              {section.content}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
