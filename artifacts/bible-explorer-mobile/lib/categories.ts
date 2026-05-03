import { Feather } from "@expo/vector-icons";
import type React from "react";

export type CategoryValue =
  | "questions"
  | "guides"
  | "topics"
  | "bible-verses"
  | "bible-characters";

export interface CategoryDef {
  value: CategoryValue;
  label: string;
  blurb: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    value: "questions",
    label: "Questions",
    blurb: "Honest answers to what people ask about Scripture.",
    icon: "help-circle",
    color: "#3b82f6",
  },
  {
    value: "guides",
    label: "Guides",
    blurb: "Step-by-step walkthroughs of biblical topics.",
    icon: "book-open",
    color: "#8b5cf6",
  },
  {
    value: "topics",
    label: "Topics",
    blurb: "Explore themes that run through the Bible.",
    icon: "compass",
    color: "#10b981",
  },
  {
    value: "bible-verses",
    label: "Bible Verses",
    blurb: "Verse-by-verse meaning and context.",
    icon: "bookmark",
    color: "#f59e0b",
  },
  {
    value: "bible-characters",
    label: "Bible Characters",
    blurb: "The lives and lessons of biblical figures.",
    icon: "users",
    color: "#ef4444",
  },
];

export function categoryByValue(value: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.value === value);
}
