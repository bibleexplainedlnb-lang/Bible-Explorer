import Link from 'next/link';

export const metadata = {
  title: 'Bible Characters | Bible Verse Insights',
  description: 'Explore the lives, stories, and spiritual lessons of key Bible characters — from Abraham and Moses to David, Ruth, and Paul.',
};

export default function BibleCharactersPage() {
  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.85rem', color: '#8b7355', marginBottom: '0.5rem' }}>
          <Link href="/" style={{ color: '#8b7355', textDecoration: 'none' }}>Home</Link>
          {' › '}Bible Characters
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.2rem', color: '#1e2d4a', margin: '0 0 0.75rem' }}>
          Bible Characters
        </h1>
        <p style={{ color: '#5a4a35', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '56rem' }}>
          Explore the lives, stories, and spiritual lessons of key figures in Scripture — from the patriarchs of Genesis to the apostles of the New Testament.
        </p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '3rem', textAlign: 'center', color: '#8b7355' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>✝</p>
        <p style={{ fontSize: '1rem', margin: 0 }}>Bible character profiles are coming soon.</p>
      </div>
    </div>
  );
}
