const verses = require('kjv/json/verses-1769.json')

// Get single verse
export function getVerse(reference) {
  return verses[reference] || null
}

// Get full chapter
export function getChapter(book, chapter) {
  const results = []

  Object.keys(verses).forEach(ref => {
    if (ref.startsWith(`${book} ${chapter}:`)) {
      results.push({
        reference: ref,
        text: verses[ref]
      })
    }
  })

  return results
}

// Format verse display
export function formatVerse(reference, text) {
  return `${reference} — ${text}`
}
