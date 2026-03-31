import type { Metadata } from "next";
import Link from "next/link";

const bibleContent: Record<
  string,
  {
    fullName: string;
    testament: string;
    chapters: Record<
      number,
      { summary: string; verses: { number: number; text: string }[] }
    >;
  }
> = {
  genesis: {
    fullName: "Genesis",
    testament: "Old Testament",
    chapters: {
      1: {
        summary:
          "The account of the six days of creation, in which God speaks the world into existence and declares it good.",
        verses: [
          { number: 1, text: "In the beginning, God created the heavens and the earth." },
          { number: 2, text: "The earth was without form and void, and darkness was over the face of the deep. And the Spirit of God was hovering over the face of the waters." },
          { number: 3, text: "And God said, \"Let there be light,\" and there was light." },
          { number: 4, text: "And God saw that the light was good. And God separated the light from the darkness." },
          { number: 5, text: "God called the light Day, and the darkness he called Night. And there was evening and there was morning, the first day." },
          { number: 26, text: "Then God said, \"Let us make man in our image, after our likeness. And let them have dominion over the fish of the sea and over the birds of the heavens and over the livestock and over all the earth and over every creeping thing that creeps on the earth.\"" },
          { number: 27, text: "So God created man in his own image, in the image of God he created him; male and female he created them." },
          { number: 31, text: "And God saw everything that he had made, and behold, it was very good. And there was evening and there was morning, the sixth day." },
        ],
      },
    },
  },
  psalms: {
    fullName: "Psalms",
    testament: "Old Testament",
    chapters: {
      23: {
        summary:
          "David's beloved psalm of trust in God as shepherd, guide, and host — one of the most memorized passages in all of Scripture.",
        verses: [
          { number: 1, text: "The Lord is my shepherd; I shall not want." },
          { number: 2, text: "He makes me lie down in green pastures. He leads me beside still waters." },
          { number: 3, text: "He restores my soul. He leads me in paths of righteousness for his name's sake." },
          { number: 4, text: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me." },
          { number: 5, text: "You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows." },
          { number: 6, text: "Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the Lord forever." },
        ],
      },
    },
  },
  proverbs: {
    fullName: "Proverbs",
    testament: "Old Testament",
    chapters: {
      1: {
        summary:
          "The introduction to Proverbs, establishing the purpose of the book: wisdom, discipline, and the fear of the Lord as the beginning of knowledge.",
        verses: [
          { number: 1, text: "The proverbs of Solomon, son of David, king of Israel:" },
          { number: 2, text: "To know wisdom and instruction, to understand words of insight," },
          { number: 3, text: "to receive instruction in wise dealing, in righteousness, justice, and equity;" },
          { number: 7, text: "The fear of the Lord is the beginning of knowledge; fools despise wisdom and instruction." },
          { number: 8, text: "Hear, my son, your father's instruction, and forsake not your mother's teaching," },
          { number: 9, text: "for they are a graceful garland for your head and pendants for your neck." },
        ],
      },
    },
  },
  john: {
    fullName: "John",
    testament: "New Testament",
    chapters: {
      1: {
        summary:
          "The prologue of John's Gospel, introducing Jesus as the eternal Word of God who became flesh and dwelt among us.",
        verses: [
          { number: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
          { number: 2, text: "He was in the beginning with God." },
          { number: 3, text: "All things were made through him, and without him was not any thing made that was made." },
          { number: 4, text: "In him was life, and the life was the light of men." },
          { number: 5, text: "The light shines in the darkness, and the darkness has not overcome it." },
          { number: 14, text: "And the Word became flesh and dwelt among us, and we have seen his glory, glory as of the only Son from the Father, full of grace and truth." },
          { number: 16, text: "For from his fullness we have all received, grace upon grace." },
        ],
      },
    },
  },
  romans: {
    fullName: "Romans",
    testament: "New Testament",
    chapters: {
      8: {
        summary:
          "A foundational chapter on life in the Spirit, the assurance of God's love, and the promise that nothing can separate believers from Christ.",
        verses: [
          { number: 1, text: "There is therefore now no condemnation for those who are in Christ Jesus." },
          { number: 2, text: "For the law of the Spirit of life has set you free in Christ Jesus from the law of sin and death." },
          { number: 28, text: "And we know that for those who love God all things work together for good, for those who are called according to his purpose." },
          { number: 31, text: "What then shall we say to these things? If God is for us, who can be against us?" },
          { number: 38, text: "For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers," },
          { number: 39, text: "nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord." },
        ],
      },
    },
  },
  revelation: {
    fullName: "Revelation",
    testament: "New Testament",
    chapters: {
      1: {
        summary:
          "John's introduction to his vision, establishing Jesus as the Alpha and Omega, and the eternal King who holds the churches in His hand.",
        verses: [
          { number: 1, text: "The revelation of Jesus Christ, which God gave him to show to his servants the things that must soon take place." },
          { number: 4, text: "John to the seven churches that are in Asia: Grace to you and peace from him who is and who was and who is to come." },
          { number: 7, text: "Behold, he is coming with the clouds, and every eye will see him, even those who pierced him, and all tribes of the earth will wail on account of him. Even so. Amen." },
          { number: 8, text: "\"I am the Alpha and the Omega,\" says the Lord God, \"who is and who was and who is to come, the Almighty.\"" },
          { number: 17, text: "When I saw him, I fell at his feet as though dead. But he laid his right hand on me, saying, \"Fear not, I am the first and the last," },
          { number: 18, text: "and the living one. I died, and behold I am alive forevermore, and I have the keys of Death and Hades.\"" },
        ],
      },
    },
  },
};

interface Props {
  params: Promise<{ book: string; chapter: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { book, chapter } = await params;
  const bookData = bibleContent[book];
  const chapterNum = parseInt(chapter, 10);
  return {
    title: bookData
      ? `${bookData.fullName} ${chapterNum} | Bible | Faith & Scripture`
      : "Bible | Faith & Scripture",
  };
}

export default async function BibleChapterPage({ params }: Props) {
  const { book, chapter } = await params;
  const chapterNum = parseInt(chapter, 10);
  const bookData = bibleContent[book];
  const chapterData = bookData?.chapters[chapterNum];

  const prevChapter = chapterNum > 1 ? chapterNum - 1 : null;
  const nextChapter = chapterNum + 1;

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>

      {bookData && chapterData ? (
        <div>
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-1">{bookData.testament}</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {bookData.fullName} {chapterNum}
            </h1>
            <p className="text-gray-600 leading-relaxed max-w-2xl italic">
              {chapterData.summary}
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            {chapterData.verses.map((verse) => (
              <div key={verse.number} className="flex gap-4">
                <span className="flex-shrink-0 text-xs font-semibold text-gray-400 w-6 mt-1 text-right">
                  {verse.number}
                </span>
                <p className="text-gray-800 leading-relaxed">{verse.text}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
            {prevChapter ? (
              <Link
                href={`/bible/${book}/${prevChapter}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                &larr; {bookData.fullName} {prevChapter}
              </Link>
            ) : (
              <span />
            )}
            <Link
              href={`/bible/${book}/${nextChapter}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              {bookData.fullName} {nextChapter} &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Chapter not found
          </h1>
          <p className="text-gray-500 mb-6">
            {bookData
              ? `Chapter ${chapterNum} of ${bookData.fullName} is not available yet.`
              : `The book "${book}" could not be found.`}
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return to home
          </Link>
        </div>
      )}
    </div>
  );
}
