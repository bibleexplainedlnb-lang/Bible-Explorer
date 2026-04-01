const API_BASE = "https://bible-api.com";

export type BibleVerse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

export type BibleChapter = {
  book: string;
  chapter: number;
  verses: BibleVerse[];
};

type ApiResponse = {
  reference: string;
  verses: {
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }[];
  translation_id: string;
};

function slugToApiName(slug: string): string {
  return slug.replace(/-/g, " ");
}

async function apiFetch(path: string): Promise<ApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/${path}?translation=kjv`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<ApiResponse>;
  } catch {
    return null;
  }
}

export async function fetchChapter(
  book: string,
  chapter: number
): Promise<BibleChapter | null> {
  const apiBook = slugToApiName(book);
  const data = await apiFetch(`${encodeURIComponent(apiBook)}+${chapter}`);
  if (!data || data.verses.length === 0) return null;

  return {
    book: data.verses[0].book_name,
    chapter,
    verses: data.verses.map((v) => ({
      book: v.book_name,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text.trim(),
    })),
  };
}

export async function fetchVerse(
  book: string,
  chapter: number,
  verse: number
): Promise<BibleVerse | null> {
  const apiBook = slugToApiName(book);
  const data = await apiFetch(
    `${encodeURIComponent(apiBook)}+${chapter}:${verse}`
  );
  if (!data || data.verses.length === 0) return null;

  const v = data.verses[0];
  return {
    book: v.book_name,
    chapter: v.chapter,
    verse: v.verse,
    text: v.text.trim(),
  };
}
