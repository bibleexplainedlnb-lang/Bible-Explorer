const verses = require('kjv/json/verses-1769.json')

// Strip KJV data artefacts: leading "#" markers and bracketed editorial notes
function cleanText(text) {
  return text
    .replace(/^#\s*/, '')          // leading "#" footnote marker
    .replace(/\[([^\]]*)\]/g, '')  // square-bracket content, e.g. [of]
    .replace(/\s{2,}/g, ' ')       // collapse any double-spaces left behind
    .trim()
}

// Get single verse — returns clean text or null
export function getVerse(reference) {
  const raw = verses[reference]
  return raw ? cleanText(raw) : null
}

// Get full chapter — returns array of { reference, text } with clean text
export function getChapter(book, chapter) {
  const results = []

  Object.keys(verses).forEach(ref => {
    if (ref.startsWith(`${book} ${chapter}:`)) {
      results.push({
        reference: ref,
        text: cleanText(verses[ref])
      })
    }
  })

  return results
}

// Format verse for display
export function formatVerse(reference, text) {
  return `${reference} — ${cleanText(text)}`
}
