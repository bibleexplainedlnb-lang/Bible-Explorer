"use client";

import { useState } from "react";
import { parseBibleReferences } from "@/lib/bible-references";

type Tab = "overview" | "context" | "application";

const tabs: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "context", label: "Context" },
  { key: "application", label: "Application" },
];

interface Props {
  explanation: {
    overview: string;
    context: string;
    application: string;
  };
}

export default function ExplanationTabs({ explanation }: Props) {
  const [active, setActive] = useState<Tab>("overview");

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === tab.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-5 flex-1">
        <p className="text-gray-700 leading-relaxed text-sm">
          {parseBibleReferences(explanation[active])}
        </p>
      </div>
    </div>
  );
}
