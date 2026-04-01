"use server";

import { redirect } from "next/navigation";
import { questions } from "@/lib/db";

export async function addQuestion(formData: FormData) {
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slug = (formData.get("slug") as string | null)?.trim() ?? "";
  const topic = (formData.get("topic") as string | null)?.trim() ?? "";
  const shortAnswer = (formData.get("shortAnswer") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() ?? "";

  if (!title || !slug) {
    redirect("/admin?error=Title+and+slug+are+required");
  }

  // Validate slug format
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    redirect("/admin?error=Slug+must+be+lowercase+letters%2C+numbers%2C+and+hyphens+only");
  }

  // Check for duplicate slug
  const existing = questions.findBySlug(slug);
  if (existing) {
    redirect(`/admin?error=A+question+with+slug+%22${encodeURIComponent(slug)}%22+already+exists`);
  }

  questions.create({ title, slug, topic, shortAnswer, content });

  redirect(`/questions/${slug}?created=1`);
}
