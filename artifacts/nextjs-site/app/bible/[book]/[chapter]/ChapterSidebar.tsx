"use client";

interface Props {
  verseCount: number;
}

const sections = [
  {
    id: "summary",
    label: "Chapter Summary",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    content:
      "A brief summary of this chapter will appear here, giving an overview of the main narrative, teaching, or events recorded.",
  },
  {
    id: "themes",
    label: "Key Themes",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    content:
      "The central themes running through this chapter — such as faith, redemption, covenant, or grace — will be highlighted here to help orient your reading.",
  },
  {
    id: "explanation",
    label: "Explanation",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    content:
      "A plain-language explanation of what this chapter means and why it matters, written for anyone encountering it for the first time.",
  },
];

export default function ChapterSidebar({ verseCount }: Props) {
  return (
    <aside className="lg:sticky lg:top-6 space-y-3">
      {/* Verse count pill */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
          In This Chapter
        </span>
        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
          {verseCount} verses
        </span>
      </div>

      {sections.map((s) => (
        <div
          key={s.id}
          className={`rounded-xl border ${s.border} ${s.bg} overflow-hidden`}
        >
          {/* Section header */}
          <div className={`flex items-center gap-2 px-4 py-3 border-b ${s.border}`}>
            <span className={s.color}>{s.icon}</span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${s.color}`}>
              {s.label}
            </span>
          </div>
          {/* Section body */}
          <div className="px-4 py-3">
            <p className="text-sm text-gray-600 leading-relaxed italic">
              {s.content}
            </p>
          </div>
        </div>
      ))}
    </aside>
  );
}
