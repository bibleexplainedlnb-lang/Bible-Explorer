const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_KEY = () => process.env.OPENROUTER_API_KEY || process.env.Open_Router_API;
export const MODEL = 'openai/gpt-4.1-mini';

export function sanitiseSlug(raw = '') {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const KEYWORD_VARIATION_RULES = `KEYWORD VARIATION RULES (follow strictly):
- faith / trust in God / belief / spiritual confidence — use variations, not the same word repeatedly
- fear / anxiety / worry / doubt — vary naturally
- prayer / praying / talking to God / seeking God — mix naturally
- love / compassion / kindness — alternate organically
- forgiveness / mercy / letting go — use varied phrasing
Use the main keyword at most 2–3 times. Spread variations throughout. Never stuff keywords.`;

const CONTENT_QUALITY_RULES = `CONTENT QUALITY RULES:
- Write like a thoughtful human author, not an AI content generator
- No filler phrases like "In today's world", "It's important to note", "As we can see"
- Every paragraph must add real value — no padding
- Structure clearly: Introduction → Explanation → Practical Application → Conclusion
- Tone: biblical, helpful, practical, warm`;

export function getPrompt(category, topic, idea) {
  const input = (idea && idea.trim()) ? idea.trim() : topic;

  if (category === 'questions') {
    return `Answer this Christian question: "${input}"

Requirements:
- 1000–1100 words
- Clear direct answer in the first paragraph
- Include specific Bible verse references (Book Chapter:Verse)
- Explain the verse in context
- Provide real-life practical application

Structure:
1. Direct answer (first paragraph — be concrete, not vague)
2. Biblical explanation with verse citations
3. Practical takeaway for daily life
4. Brief conclusion

${KEYWORD_VARIATION_RULES}

${CONTENT_QUALITY_RULES}`;
  }

  if (category === 'guides') {
    return `Write a detailed Christian guide: "${input}"

Requirements:
- 1300–1500 words
- Deep, practical, and immediately actionable
- At least 5 clear steps with Bible backing

Structure:
1. Introduction (hook with a relatable problem or question)
2. 5–7 numbered steps, each with a Bible reference
3. Real-life examples for 2–3 steps
4. Practical application section
5. Conclusion with encouragement

${KEYWORD_VARIATION_RULES}

${CONTENT_QUALITY_RULES}`;
  }

  if (category === 'teachings') {
    return `Write a deep Christian teaching article: "${input}"

Requirements:
- 1300–1500 words
- Theological depth with clarity and accessibility
- Ground every claim in Scripture

Structure:
1. Introduction — why this teaching matters today
2. Background / historical context
3. Core meaning — what the Bible says (cite specific verses)
4. Key lessons with application
5. Conclusion — call to reflection or action

${KEYWORD_VARIATION_RULES}

${CONTENT_QUALITY_RULES}`;
  }

  return `Write a helpful, in-depth Christian article about "${input}".
Structure it with an introduction, explanation, practical application, and conclusion.
${KEYWORD_VARIATION_RULES}
${CONTENT_QUALITY_RULES}`;
}

export async function callOpenRouter(messages) {
  const apiKey = OPENROUTER_KEY();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://bibleverseinsights.com',
      'X-Title':      'Bible Verse Insights',
    },
    body: JSON.stringify({ model: MODEL, messages, response_format: { type: 'json_object' } }),
  });

  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('OpenRouter returned empty content');
  return content;
}
