const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_KEY = () => process.env.OPENROUTER_API_KEY || process.env.Open_Router_API;
export const MODEL = 'openai/gpt-4.1-mini';

export function sanitiseSlug(raw = '') {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function getPrompt(category, topic, idea) {
  const input = (idea && idea.trim()) ? idea.trim() : topic;

  if (category === 'questions') {
    return `Answer this Christian question: "${input}"

Requirements:
- 1000–1100 words
- Clear direct answer first
- Include Bible references
- Provide explanation and real-life application

Structure:
- Direct answer
- Explanation
- Bible references
- Practical takeaway

Write in a natural human tone. Avoid repetition and AI-like phrasing.`;
  }

  if (category === 'guides') {
    return `Write a detailed Christian guide: "${input}"

Requirements:
- 1300–1500 words
- Deep, practical, and actionable

Structure:
- Introduction
- 5–7 clear steps
- Bible references
- Real-life examples
- Practical application

Avoid generic content. Make it useful and engaging.`;
  }

  if (category === 'teachings') {
    return `Write a deep Christian teaching article: "${input}"

Requirements:
- 1300–1500 words
- Deep explanation with theological clarity

Structure:
- Introduction
- Background/context
- Meaning and explanation
- Bible references
- Key lessons
- Application in life

Write like a human teacher. Avoid fluff and generic AI tone.`;
  }

  return `Write a helpful Christian article about "${input}"`;
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
