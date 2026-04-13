const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_KEY = () => process.env.OPENROUTER_API_KEY || process.env.Open_Router_API;
export const MODEL = 'openai/gpt-4.1-mini';

export function sanitiseSlug(raw = '') {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const BANNED_PHRASES = `BANNED PHRASES — never use any of these:
- "In today's world" / "In today's fast-paced world" / "In a world where"
- "It's important to note" / "It is worth noting" / "It goes without saying"
- "As we can see" / "As mentioned above" / "As previously discussed"
- "Delve into" / "Dive into" / "Embark on" / "Journey into"
- "Let's explore" / "Let's dive" / "Let's look at"
- "Transformative" / "Game-changer" / "Holistic" / "Robust"
- "At the end of the day" / "The bottom line is"
- "Furthermore, it is" / "Moreover, it is" / "Additionally, it should be noted"
- Passive openers like "Faith is important." or "Prayer matters."
- Filler closers like "May God bless you on your journey."
- Any sentence that just restates the topic without adding meaning`;

const KEYWORD_VARIATION_RULES = `KEYWORD VARIATION — follow strictly:
- faith / trust in God / belief / confidence in God / reliance on Him — rotate, never repeat the same word in adjacent paragraphs
- fear / anxiety / worry / doubt / dread — vary naturally through the piece
- prayer / praying / talking with God / seeking God / turning to Him — mix organically
- love / compassion / care / kindness / grace — alternate throughout
- forgiveness / mercy / releasing bitterness / letting go — use varied phrasing
- The primary topic keyword appears at most 2–3 times total. Spread synonyms through the rest. Never keyword-stuff.`;

const HUMAN_WRITING_RULES = `HUMAN WRITING RULES — mandatory:
1. Open with something concrete: a scenario, a honest question, a short story beat, or a struggle — never a definition or generic statement
2. Use contractions naturally (it's, you're, we've, isn't, didn't, won't) — a human wrote this
3. Vary sentence length deliberately — short punchy sentences. Then a longer one that builds an idea with more texture and nuance. Then short again.
4. Speak directly to the reader: "you", "your", "we", "us" — not "one" or "Christians"
5. Each paragraph must introduce one distinct idea — no padding, no summarising the previous paragraph
6. Cite Bible verses as a living voice, not a proof-text: give the verse, then unpack what it actually means in context
7. Include at least one honest acknowledgement of difficulty — faith is hard sometimes; acknowledge it
8. Avoid ending sections with a tidy bow — real life is messier; close with something to sit with
9. Never start two consecutive paragraphs with the same word
10. The conclusion must not begin with "In conclusion" or "To sum up"`;

const PRACTICAL_VALUE_RULES = `PRACTICAL VALUE — every article must include:
- A section (or paragraph) titled or themed "What This Means for You" — specific, not generic
- A section (or paragraph) themed "How to Apply This" — concrete steps, not vague encouragement
- At least one real-life example or scenario that a reader can recognise themselves in`;

export function getPrompt(category, topic, idea) {
  const input = (idea && idea.trim()) ? idea.trim() : topic;

  if (category === 'questions') {
    return `Write a Christian article answering this question: "${input}"

LENGTH: 1000–1100 words of body content (HTML paragraphs, not counting headings)

OPENING (choose ONE style — do not use the same style every time):
Option A — Start with a relatable scenario: paint a brief, specific moment a reader might recognise ("You've read the verse a dozen times. You've even memorised it. But it hasn't changed the fear that wakes you at 3am.")
Option B — Start with an honest, searching question that the article will answer genuinely
Option C — Start with a short, striking observation that reframes how the reader sees the topic

STRUCTURE (use <h2> and <h3> for headings, <p> for paragraphs, <ul>/<li> for lists, <strong> for key phrases):
1. Hook opening — 1–2 paragraphs, no heading, draws the reader in
2. <h2>The Direct Answer</h2> — concrete, not hedged; cite at least one specific Bible verse (Book Chapter:Verse) and explain what it actually means
3. <h2>What the Bible Really Says</h2> — 2–3 paragraphs unpacking relevant Scripture in context; avoid proof-texting; show the meaning behind the words
4. <h2>What This Means for You</h2> — specific application to real life; not "pray more", but something a reader can do or think differently about today
5. <h2>How to Apply This</h2> — 3–4 practical steps, grounded in Scripture; include a brief real-life example for at least one step
6. Closing paragraph — no heading; end with something honest and open, not a tidy platitude

${KEYWORD_VARIATION_RULES}

${HUMAN_WRITING_RULES}

${PRACTICAL_VALUE_RULES}

${BANNED_PHRASES}`;
  }

  if (category === 'guides') {
    return `Write a detailed Christian guide: "${input}"

LENGTH: 1300–1500 words of body content

OPENING (choose ONE style — rotate across articles):
Option A — Open with a problem the reader is trying to solve: be specific about the frustration or gap
Option B — Open with a short narrative scene that makes the topic feel urgent and real
Option C — Open with a counterintuitive statement that challenges a common assumption about the topic

STRUCTURE (use <h2>/<h3> for sections, <p> for paragraphs, <ol>/<li> for numbered steps, <ul>/<li> for lists, <strong> for key phrases):
1. Hook introduction — 2 paragraphs, no heading; establish what problem this guide solves and why it matters
2. <h2>Why This Matters</h2> — brief theological grounding; connect the topic to something the reader already cares about; 1 Bible verse with real explanation
3. <h2>Step-by-Step Guide</h2> — 5–7 numbered steps (<ol>); each step has:
   - A clear action title in <strong>
   - 2–3 sentences explaining the step
   - A Bible reference with a one-sentence interpretation
   - For at least 2 steps: a concrete real-life example or scenario
4. <h2>What This Looks Like in Practice</h2> — a short narrative showing someone walking through the guide; make it feel real, not hypothetical
5. <h2>Common Pitfalls to Avoid</h2> — 2–3 honest mistakes people make; frame with empathy, not judgment
6. Closing paragraph — no heading; end with encouragement that feels earned, not formulaic

${KEYWORD_VARIATION_RULES}

${HUMAN_WRITING_RULES}

${PRACTICAL_VALUE_RULES}

${BANNED_PHRASES}`;
  }

  if (category === 'teachings') {
    return `Write a deep Christian teaching article: "${input}"

LENGTH: 1300–1500 words of body content

OPENING (choose ONE style — vary across articles):
Option A — Open with a historical or biblical moment that crystallises the teaching
Option B — Open with a theological tension or paradox that the article will resolve
Option C — Open with a question the church has wrestled with that makes the teaching feel alive today

STRUCTURE (use <h2>/<h3>, <p>, <ul>/<li>, <strong>):
1. Hook opening — 2 paragraphs, no heading; frame why this teaching is worth understanding now, from a human angle
2. <h2>The Biblical Foundation</h2> — 2–3 paragraphs; cite 2–3 key verses; explain them in their original context, not just as standalone quotes; note any nuance in the original language if relevant
3. <h2>Historical and Theological Context</h2> — how the church has understood this teaching; mention any significant theological debate honestly; 1–2 paragraphs
4. <h2>What It Actually Means</h2> — cut through theological jargon; explain in plain terms what this teaching says about God, humans, and the relationship between them
5. <h2>What This Means for You</h2> — specific, personal application; not "apply this to your life" but a concrete example of how this teaching changes how you see Monday morning
6. <h2>How to Live This Out</h2> — 3–4 practical applications; each grounded in the teaching itself, not generic advice
7. Closing paragraph — no heading; end with a reflection or question to sit with, not a call-to-action

${KEYWORD_VARIATION_RULES}

${HUMAN_WRITING_RULES}

${PRACTICAL_VALUE_RULES}

${BANNED_PHRASES}`;
  }

  return `Write a helpful, in-depth Christian article about "${input}".

LENGTH: 1000–1200 words

Open with a hook that earns the reader's attention. Structure clearly with an introduction, biblical explanation, practical application ("What This Means for You"), and a genuine closing thought.

${KEYWORD_VARIATION_RULES}

${HUMAN_WRITING_RULES}

${PRACTICAL_VALUE_RULES}

${BANNED_PHRASES}`;
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
