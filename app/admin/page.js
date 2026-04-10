'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [topics,  setTopics]  = useState([]);
  const [topic,   setTopic]   = useState('');
  const [idea,    setIdea]    = useState('');
  const [status,  setStatus]  = useState('idle'); // idle | generating | preview | saving | saved
  const [preview, setPreview] = useState(null);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch('/api/topics/')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setTopics(d); })
      .catch(() => {});
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!topic) { setError('Please select a topic.'); return; }

    setError('');
    setPreview(null);
    setStatus('generating');

    try {
      const res = await fetch('/api/generate-question/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          topic,
          keywords: idea.trim() ? idea.split(',').map((k) => k.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Generation failed.'); setStatus('idle'); return; }
      setPreview(data);
      setStatus('preview');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  async function handleSave() {
    if (!preview) return;
    setError('');
    setStatus('saving');

    try {
      const res = await fetch('/api/save-question/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(preview),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Save failed.'); setStatus('preview'); return; }
      setStatus('saved');
      setPreview(data.question);
    } catch (err) {
      setError(err.message);
      setStatus('preview');
    }
  }

  function handleReset() {
    setStatus('idle');
    setPreview(null);
    setError('');
    setIdea('');
  }

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '3rem 1.25rem', fontFamily: 'Georgia, serif' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <Link href="/" style={{ color: '#b8860b', textDecoration: 'none', fontSize: '0.85rem' }}>
          ← Back to site
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e2d4a', margin: '0.5rem 0 0.25rem' }}>
          Content Generator
        </h1>
        <p style={{ margin: 0, color: '#6b6b6b', fontSize: '0.9rem' }}>
          Generate and publish a new Bible study article.
        </p>
      </div>

      {/* ── Success state ── */}
      {status === 'saved' && preview && (
        <div style={{ backgroundColor: '#f0fff4', border: '1px solid #b2dfdb', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '2rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 'bold', color: '#1b5e20', fontSize: '1rem' }}>
            Article published successfully
          </p>
          <p style={{ margin: '0 0 1rem', color: '#2d6a4f', fontSize: '0.9rem' }}>
            <em>{preview.title}</em> is now live.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              href={`/questions/${preview.slug}/`}
              style={{ backgroundColor: '#1e2d4a', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '600' }}
            >
              View article →
            </Link>
            <button
              onClick={handleReset}
              style={{ backgroundColor: 'transparent', color: '#1e2d4a', border: '1px solid #ccc', padding: '0.5rem 1.25rem', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Generate another
            </button>
          </div>
        </div>
      )}

      {/* ── Form ── */}
      {status !== 'saved' && (
        <div style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2rem', marginBottom: '1.5rem' }}>
          <form onSubmit={handleGenerate}>

            {/* Topic */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                Topic
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '1rem', fontFamily: 'inherit', background: 'white', outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">— Select a topic —</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Content Idea */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                Content Idea{' '}
                <span style={{ fontWeight: 400, color: '#8b7355' }}>(optional)</span>
              </label>
              <input
                type="text"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g. how to forgive someone who hurt you, overcoming doubt"
                style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#8b7355' }}>
                A keyword, angle, or short description to guide the article. Leave blank to let the AI decide.
              </p>
            </div>

            {error && (
              <div style={{ backgroundColor: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={status === 'generating'}
                style={{ backgroundColor: '#1e2d4a', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.7rem 1.75rem', fontSize: '0.95rem', fontWeight: '600', cursor: status === 'generating' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: status === 'generating' ? 0.75 : 1 }}
              >
                {status === 'generating' ? 'Generating…' : '✦ Generate Article'}
              </button>
              {status === 'preview' && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{ backgroundColor: 'transparent', color: '#6b6b6b', border: '1px solid #d4c5a9', borderRadius: '0.5rem', padding: '0.7rem 1.25rem', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Start over
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── Generating spinner ── */}
      {status === 'generating' && (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', color: '#8b7355' }}>
          <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>✦</div>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>Writing article — this usually takes 15–20 seconds…</p>
        </div>
      )}

      {/* ── Preview ── */}
      {status === 'preview' && preview && (
        <div style={{ backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2rem' }}>

          {/* Preview header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Preview — not yet saved
              </span>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: 'bold', color: '#1e2d4a', margin: '0.3rem 0 0', lineHeight: 1.35 }}>
                {preview.title}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
              <button
                onClick={handleSave}
                disabled={status === 'saving'}
                style={{ backgroundColor: '#b8860b', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.6rem 1.5rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {status === 'saving' ? 'Saving…' : '✓ Save'}
              </button>
              <button
                onClick={handleGenerate}
                style={{ backgroundColor: 'transparent', color: '#1e2d4a', border: '1px solid #d4c5a9', borderRadius: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ↻ Regenerate
              </button>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e8dfc8', margin: '0 0 1.5rem' }} />

          {/* SEO fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: '#f9f5ee', borderRadius: '0.5rem', padding: '0.875rem', border: '1px solid #e8dfc8' }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.7rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Meta Title</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e2d4a', lineHeight: 1.5 }}>{preview.metaTitle}</p>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#aaa' }}>{preview.metaTitle?.length} chars</p>
            </div>
            <div style={{ backgroundColor: '#f9f5ee', borderRadius: '0.5rem', padding: '0.875rem', border: '1px solid #e8dfc8' }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.7rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Meta Description</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e2d4a', lineHeight: 1.5 }}>{preview.metaDescription}</p>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#aaa' }}>{preview.metaDescription?.length} chars</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: '#f9f5ee', borderRadius: '0.5rem', padding: '0.875rem', border: '1px solid #e8dfc8' }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.7rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Slug</p>
              <p style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'monospace', color: '#1e2d4a' }}>{preview.slug}</p>
            </div>
            <div style={{ backgroundColor: '#f9f5ee', borderRadius: '0.5rem', padding: '0.875rem', border: '1px solid #e8dfc8' }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.7rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Topic</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e2d4a' }}>{preview.topicName ?? '—'}</p>
            </div>
          </div>

          {/* Keywords */}
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Keywords</p>
            <div>
              {(preview.keywords ?? []).map((k) => (
                <span key={k} style={{ display: 'inline-block', backgroundColor: '#f5f0e8', color: '#8b7355', fontSize: '0.78rem', padding: '0.2rem 0.65rem', borderRadius: '1rem', border: '1px solid #e8dfc8', marginRight: '0.4rem', marginBottom: '0.4rem' }}>
                  {k}
                </span>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e8dfc8', margin: '0 0 1.5rem' }} />

          {/* Article body */}
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.7rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Article Content</p>
          <div
            className="prose-content"
            style={{ lineHeight: 1.8, color: '#2a2a2a', fontSize: '0.95rem' }}
            dangerouslySetInnerHTML={{ __html: preview.contentHtml }}
          />

          <hr style={{ border: 'none', borderTop: '1px solid #e8dfc8', margin: '1.5rem 0 1.25rem' }} />

          {error && (
            <div style={{ backgroundColor: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              style={{ backgroundColor: '#b8860b', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.7rem 1.75rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {status === 'saving' ? 'Saving…' : '✓ Save to Database'}
            </button>
            <button
              onClick={handleReset}
              style={{ backgroundColor: 'transparent', color: '#6b6b6b', border: '1px solid #d4c5a9', borderRadius: '0.5rem', padding: '0.7rem 1.25rem', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
