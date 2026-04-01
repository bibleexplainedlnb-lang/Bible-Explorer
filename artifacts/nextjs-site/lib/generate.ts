/**
 * Content generation — server only.
 *
 * generateContent(keyword, topic) → { shortAnswer, content }
 *
 * Calls the OpenAI Chat Completions API and returns structured HTML
 * with five sections: Short Answer, Biblical Explanation, Meaning,
 * Application, and Related Verses.
 *
 * Environment variables (see .env.example):
 *   - On Replit: AI_INTEGRATIONS_OPENAI_BASE_URL + AI_INTEGRATIONS_OPENAI_API_KEY
 *                are set automatically via Replit AI Integrations.
 *   - Elsewhere: set OPENAI_API_KEY (and optionally OPENAI_BASE_URL).
 */

import OpenAI from "openai";

// Support both Replit AI Integrations and standard OpenAI credentials.
const client = new OpenAI({
  baseURL:
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    "https://api.openai.com/v1",
  apiKey:
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY ??
    process.env.OPENAI_API_KEY ??
    "missing-api-key",
});

export interface GeneratedContent {
  /** One-sentence plain-text summary */
  shortAnswer: string;
  /** Full HTML article with section headings */
  content: string;
}

const SYSTEM_PROMPT = `You are a knowledgeable Christian content writer who produces clear, thoughtful, biblically grounded answers.

When asked to write about a faith keyword and topic, return a JSON object with exactly two keys:

1. "shortAnswer" — a single plain-text sentence (no HTML) that directly answers what the keyword means or is. Keep it under 30 words.

2. "content" — a complete HTML article (NO markdown, only valid HTML tags) containing these five sections in order, each wrapped in a <section> tag:

  <section>
    <h2>Biblical Explanation</h2>
    <p>2–3 paragraphs explaining what the Bible says about this topic. Quote at least one scripture with reference inline.</p>
  </section>

  <section>
    <h2>Meaning</h2>
    <p>1–2 paragraphs on the theological meaning and significance.</p>
  </section>

  <section>
    <h2>Application</h2>
    <p>1–2 paragraphs on how a believer applies this in daily life.</p>
  </section>

  <section>
    <h2>Related Verses</h2>
    <ul>
      <li><strong>Book Chapter:Verse</strong> — brief description of relevance</li>
      <!-- 3–5 verses total -->
    </ul>
  </section>

Rules:
- Return ONLY raw JSON — no markdown fences, no commentary outside the JSON.
- Use only these HTML tags: p, h2, strong, em, ul, li, section, blockquote.
- Bible verse references must follow this exact format: "Book Chapter:Verse" (e.g. "John 3:16", "Romans 8:28"). No abbreviations.
- Write in a warm, pastoral tone. Avoid jargon. Aim for 500–700 words of content total.`;

/**
 * Generate structured faith content for a given keyword and topic.
 *
 * @param keyword - The faith concept to write about (e.g. "grace", "repentance")
 * @param topic   - The broader theological topic (e.g. "Salvation", "Prayer")
 * @returns `{ shortAnswer, content }` — shortAnswer is plain text; content is clean HTML
 */
export async function generateContent(
  keyword: string,
  topic: string
): Promise<GeneratedContent> {
  const userPrompt = `Keyword: "${keyword}"
Topic: "${topic}"

Write the structured faith content as described.`;

  const response = await client.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? "";

  // Strip any accidental markdown fences before parsing
  const jsonText = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: GeneratedContent;
  try {
    parsed = JSON.parse(jsonText) as GeneratedContent;
  } catch {
    throw new Error(
      `Content generation returned invalid JSON. Raw response:\n${raw.slice(0, 300)}`
    );
  }

  if (!parsed.shortAnswer || !parsed.content) {
    throw new Error(
      "Generated content is missing required fields (shortAnswer or content)."
    );
  }

  return {
    shortAnswer: parsed.shortAnswer.trim(),
    content: parsed.content.trim(),
  };
}
