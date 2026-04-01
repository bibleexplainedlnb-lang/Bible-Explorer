"use server";

import { redirect } from "next/navigation";
import { questions } from "@/lib/db";
import { enrichContent } from "@/lib/enrich";

/** Called by the form — enriches content, saves, and redirects */
export async function addQuestion(formData: FormData) {
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slug = (formData.get("slug") as string | null)?.trim() ?? "";
  const topic = (formData.get("topic") as string | null)?.trim() ?? "";
  const shortAnswer = (formData.get("shortAnswer") as string | null)?.trim() ?? "";
  const rawContent = (formData.get("content") as string | null)?.trim() ?? "";

  if (!title || !slug) {
    redirect("/admin?error=Title+and+slug+are+required");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    redirect("/admin?error=Slug+must+be+lowercase+letters%2C+numbers%2C+and+hyphens+only");
  }

  if (questions.findBySlug(slug)) {
    redirect(`/admin?error=A+question+with+slug+%22${encodeURIComponent(slug)}%22+already+exists`);
  }

  // Enrich the HTML content with internal links before persisting
  // excludeSlug prevents the new question from linking to itself
  const content = rawContent ? enrichContent(rawContent, slug) : "";

  questions.create({ title, slug, topic, shortAnswer, content });
  redirect(`/questions/${slug}?created=1`);
}

/** Real-time slug availability check — callable from client components */
export async function checkSlugAvailable(slug: string): Promise<boolean> {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false;
  return !questions.findBySlug(slug);
}
