'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:    { maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem', fontFamily: 'Georgia, serif' },
  header:  { marginBottom: '2rem' },
  back:    { color: '#b8860b', textDecoration: 'none', fontSize: '0.875rem' },
  h1:      { fontSize: '1.875rem', fontWeight: 'bold', color: '#1e2d4a', marginTop: '0.5rem', marginBottom: 0 },
  card:    { backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2rem', marginBottom: '1.5rem' },
  label:   { display: 'block', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.35rem', fontSize: '0.9rem' },
  input:   { width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' },
  select:  { width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box', background: 'white', outline: 'none' },
  hint:    { fontSize: '0.8rem', color: '#8b7355', marginTop: '0.25rem' },
  btnRow:  { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' },
  btnPrimary: { backgroundColor: '#1e2d4a', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnGold: { backgroundColor: '#b8860b', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnGhost: { backgroundColor: 'transparent', color: '#1e2d4a', border: '1px solid #d4c5a9', borderRadius: '0.5rem', padding: '0.7rem 1.25rem', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' },
  tag:     { display: 'inline-block', backgroundColor: '#f5f0e8', color: '#8b7355', fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid #e8dfc8', marginRight: '0.35rem', marginBottom: '0.35rem' },
  metaRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
  metaBox: { backgroundColor: '#f9f5ee', borderRadius: '0.5rem', padding: '0.875rem', border: '1px solid #e8dfc8' },
  metaKey: { fontSize: '0.75rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' },
  metaVal: { fontSize: '0.875rem', color: '#1e2d4a', lineHeight: 1.5 },
  alertErr: { backgroundColor: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '0.5rem', padding: '0.875rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' },
  alertOk:  { backgroundColor: '#f0fff4', border: '1px solid #b2dfdb', color: '#1b5e20', borderRadius: '0.5rem', padding: '0.875rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' },
  divider: { border: 'none', borderTop: '1px solid #e8dfc8', margin: '1.5rem 0' },
  slug:    { fontFamily: 'monospace', backgroundColor: '#f5f0e8', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.9em' },
  prose:   { lineHeight: 1.75, color: '#2a2a2a', fontSize: '0.95rem' },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [topics,   setTopics]   = useState([]);
  const [topic,    setTopic]    = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [preview,  setPreview]  = useState(null);
  const [error,    setError]    = useState('');
  const [saved,    setSaved]    = useState(null);

  // Load topics on mount
  useEffect(() => {
    fetch('/api/topics/')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTopics(data); })
      .catch(() => {});
  }, []);

  // ── Generate ─────────────────────────────────────────────────────────────
  async function handleGenerate(e) {
    e.preventDefault();
    if (!topic.trim()) { setError('Please select or enter a topic.'); return; }

    setError('');
    setPreview(null);
    setSaved(null);
    setLoading(true);

    try {
      const kwArray = keywords.split(',').map((k) => k.trim()).filter(Boolean);
      const res = await fetch('/api/generate-question/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), keywords: kwArray }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Generation failed (${res.status})`);
      } else {
        setPreview(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!preview) return;
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/save-question/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Save failed (${res.status})`);
      } else {
        setSaved(data.question);
        setPreview(null);
        setTopic('');
        setKeywords('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <Link href="/" style={S.back}>← Back to site</Link>
        <h1 style={S.h1}>Content Generator</h1>
        <p style={{ color: '#5a5a5a', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          Generate and publish AI-written Bible question articles directly to the database.
        </p>
      </div>

      {/* Success banner */}
      {saved && (
        <div style={S.alertOk}>
          <strong>Saved!</strong> <em>{saved.title}</em> is now live at{' '}
          <Link href={`/questions/${saved.slug}/`} style={{ color: '#1b5e20' }}>
            /questions/{saved.slug}/
          </Link>
          <button
            onClick={() => setSaved(null)}
            style={{ ...S.btnGhost, padding: '0.2rem 0.6rem', marginLeft: '1rem', fontSize: '0.8rem' }}
          >
            Generate another
          </button>
        </div>
      )}

      {/* ── Form card ── */}
      <div style={S.card}>
        <form onSubmit={handleGenerate}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Topic</label>
            {topics.length > 0 ? (
              <select
                style={S.select}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                <option value="">— Select a topic —</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            ) : (
              <input
                style={S.input}
                placeholder="e.g. Grace, Faith, Prayer…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            )}
            <p style={S.hint}>The topic this article belongs to.</p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Focus Keywords <span style={{ fontWeight: 400, color: '#8b7355' }}>(optional)</span></label>
            <input
              style={S.input}
              placeholder="e.g. what is forgiveness, how to forgive, Bible on forgiveness"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
            <p style={S.hint}>Comma-separated. Leave blank to let AI decide.</p>
          </div>

          {error && <div style={S.alertErr}>{error}</div>}

          <div style={S.btnRow}>
            <button type="submit" style={S.btnPrimary} disabled={loading}>
              {loading ? 'Generating…' : '✦ Generate Article'}
            </button>
            {preview && !loading && (
              <button type="button" style={S.btnGhost} onClick={() => { setPreview(null); setError(''); }}>
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <div style={{ ...S.card, textAlign: 'center', color: '#8b7355', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✦</div>
          <p style={{ margin: 0 }}>Writing article — this takes 10–20 seconds…</p>
        </div>
      )}

      {/* ── Preview card ── */}
      {preview && !loading && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Preview — not yet saved
              </p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#1e2d4a', margin: '0.25rem 0 0' }}>
                {preview.title}
              </h2>
            </div>
            <div style={S.btnRow}>
              <button style={S.btnGold} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : '✓ Save to Database'}
              </button>
              <button style={S.btnGhost} onClick={handleGenerate} disabled={loading}>
                ↻ Regenerate
              </button>
            </div>
          </div>

          <hr style={S.divider} />

          {/* SEO metadata grid */}
          <div style={S.metaRow}>
            <div style={S.metaBox}>
              <div style={S.metaKey}>Meta Title</div>
              <div style={S.metaVal}>{preview.metaTitle}</div>
              <div style={{ ...S.hint, marginTop: '0.35rem' }}>{preview.metaTitle?.length} chars</div>
            </div>
            <div style={S.metaBox}>
              <div style={S.metaKey}>Meta Description</div>
              <div style={S.metaVal}>{preview.metaDescription}</div>
              <div style={{ ...S.hint, marginTop: '0.35rem' }}>{preview.metaDescription?.length} chars</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={S.metaBox}>
              <div style={S.metaKey}>Slug</div>
              <div style={S.metaVal}><span style={S.slug}>{preview.slug}</span></div>
            </div>
            <div style={S.metaBox}>
              <div style={S.metaKey}>Topic</div>
              <div style={S.metaVal}>{preview.topicName ?? '—'}</div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={S.metaKey}>Keywords</div>
            <div style={{ marginTop: '0.35rem' }}>
              {(preview.keywords ?? []).map((k) => (
                <span key={k} style={S.tag}>{k}</span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={S.metaKey}>Related Slugs</div>
            <div style={{ marginTop: '0.35rem' }}>
              {(preview.relatedSlugs ?? []).length > 0
                ? preview.relatedSlugs.map((s) => <span key={s} style={S.tag}>{s}</span>)
                : <span style={{ color: '#8b7355', fontSize: '0.85rem' }}>None resolved from existing questions</span>
              }
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={S.metaKey}>Summary</div>
            <p style={{ ...S.metaVal, margin: '0.35rem 0 0', fontStyle: 'italic', color: '#5a5a5a' }}>
              {preview.summary}
            </p>
          </div>

          <hr style={S.divider} />

          {/* Article content preview */}
          <div style={S.metaKey}>Article Content</div>
          <div
            className="prose-content"
            style={{ ...S.prose, marginTop: '0.75rem' }}
            dangerouslySetInnerHTML={{ __html: preview.contentHtml }}
          />

          <hr style={S.divider} />

          <div style={S.btnRow}>
            <button style={S.btnGold} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : '✓ Save to Database'}
            </button>
            <button style={S.btnGhost} onClick={() => { setPreview(null); setError(''); }}>
              Discard
            </button>
          </div>

          {error && <div style={{ ...S.alertErr, marginTop: '1rem' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
