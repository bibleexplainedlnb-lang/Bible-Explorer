'use client';

import { useState, useEffect } from 'react';

export default function Generator({ onSaved }) {
  const [topics,        setTopics]        = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError,   setTopicsError]   = useState('');

  const [selectedTopic, setSelectedTopic] = useState('');
  const [idea,          setIdea]          = useState('');

  const [generating, setGenerating] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [preview,    setPreview]    = useState(null);
  const [error,      setError]      = useState('');
  const [saved,      setSaved]      = useState(false);

  useEffect(() => {
    setTopicsLoading(true);
    fetch('/api/admin/topics')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        console.log('Topics:', data);
        setTopics(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Topics fetch error:', err);
        setTopicsError('Failed to load topics: ' + err.message);
      })
      .finally(() => setTopicsLoading(false));
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!selectedTopic) { setError('Please select a topic.'); return; }

    const topic = topics.find(t => t.id === selectedTopic);
    setError(''); setPreview(null); setSaved(false); setGenerating(true);

    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId:   selectedTopic,
          topicName: topic?.name    || '',
          category:  topic?.category || '',
          idea:      idea.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setPreview(data);
    } catch (err) {
      console.error('Generate error:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(publish) {
    if (!preview) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preview, status: publish ? 'published' : 'draft' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaved(true);
      setPreview(null);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setSelectedTopic(''); setIdea(''); setPreview(null);
    setError(''); setSaved(false); setGenerating(false);
  }

  return (
    <div style={{ maxWidth: '780px' }}>

      {/* ── Success banner ── */}
      {saved && (
        <div style={s.successBanner}>
          Article saved! <button onClick={reset} style={s.linkBtn}>Generate another</button>
        </div>
      )}

      {/* ── Form ── */}
      {!saved && (
        <div style={s.card}>
          <form onSubmit={handleGenerate}>

            {/* Topic */}
            <div style={s.field}>
              <label style={s.label} htmlFor="topic-select">Topic</label>

              {topicsLoading && (
                <div style={s.placeholder}>Loading topics…</div>
              )}

              {!topicsLoading && topicsError && (
                <div style={s.errBox}>{topicsError}</div>
              )}

              {!topicsLoading && !topicsError && (
                <select
                  id="topic-select"
                  value={selectedTopic}
                  onChange={e => {
                    console.log('Selected topic:', e.target.value);
                    setSelectedTopic(e.target.value);
                    setError('');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    color: '#000',
                    border: '1px solid #d4c5a9',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    appearance: 'auto',
                    WebkitAppearance: 'auto',
                    MozAppearance: 'auto',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select a topic</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              )}

              {!topicsLoading && !topicsError && topics.length > 0 && (
                <p style={s.hint}>{topics.length} topics available</p>
              )}
            </div>

            {/* Content idea */}
            <div style={s.field}>
              <label style={s.label} htmlFor="idea-input">
                Content Idea <span style={{ fontWeight: 400, color: '#8b7355' }}>(optional)</span>
              </label>
              <input
                id="idea-input"
                type="text"
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="e.g. how to forgive someone, overcoming doubt"
                style={s.input}
              />
              <p style={s.hint}>A keyword or angle to guide the article. Leave blank to let AI choose.</p>
            </div>

            {error && <div style={s.errBox}>{error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="submit"
                disabled={generating || topicsLoading}
                style={{ ...s.btnPrimary, opacity: (generating || topicsLoading) ? 0.6 : 1 }}
              >
                {generating ? '⟳ Generating…' : '✦ Generate Article'}
              </button>
              {preview && !generating && (
                <button type="button" onClick={reset} style={s.btnGhost}>Start over</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── Generating indicator ── */}
      {generating && (
        <div style={{ ...s.card, textAlign: 'center', padding: '3rem', marginTop: '1.25rem' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>✦</p>
          <p style={{ color: '#8b7355', margin: 0 }}>Writing article — usually 15–25 seconds…</p>
        </div>
      )}

      {/* ── Preview ── */}
      {preview && !generating && (
        <div style={{ ...s.card, marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1 }}>
              <span style={s.badgeLabel}>Preview — not saved yet</span>
              <h2 style={s.previewTitle}>{preview.title}</h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => handleSave(false)} disabled={saving} style={s.btnGhost}>
                {saving ? 'Saving…' : '📄 Save Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving} style={s.btnGold}>
                {saving ? 'Saving…' : '✓ Publish'}
              </button>
              <button onClick={reset} style={s.btnGhost}>Discard</button>
            </div>
          </div>

          <div style={s.metaGrid}>
            <div style={s.metaBox}>
              <p style={s.metaLabel}>Meta Title ({preview.meta_title?.length || 0} chars)</p>
              <p style={s.metaVal}>{preview.meta_title}</p>
            </div>
            <div style={s.metaBox}>
              <p style={s.metaLabel}>Meta Description ({preview.meta_description?.length || 0} chars)</p>
              <p style={s.metaVal}>{preview.meta_description}</p>
            </div>
          </div>

          {preview.keywords?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={s.metaLabel}>Keywords</p>
              {preview.keywords.map(k => <span key={k} style={s.tag}>{k}</span>)}
            </div>
          )}

          <hr style={s.hr} />

          <div
            style={{ lineHeight: 1.8, color: '#2a2a2a', fontSize: '0.95rem' }}
            dangerouslySetInnerHTML={{ __html: preview.content }}
          />

          {error && <div style={{ ...s.errBox, marginTop: '1rem' }}>{error}</div>}

          <hr style={{ ...s.hr, margin: '1.5rem 0' }} />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => handleSave(false)} disabled={saving} style={s.btnGhost}>📄 Save Draft</button>
            <button onClick={() => handleSave(true)} disabled={saving} style={s.btnGold}>✓ Publish Now</button>
            <button onClick={reset} style={s.btnGhost}>Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  card:        { background: '#fff', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2rem' },
  field:       { marginBottom: '1.25rem' },
  label:       { display: 'block', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.45rem', fontSize: '0.9rem' },
  input:       { display: 'block', width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '6px', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#000', backgroundColor: '#fff' },
  hint:        { margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#8b7355' },
  placeholder: { padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '6px', fontSize: '0.9rem', color: '#8b7355', background: '#f9f5ee', fontStyle: 'italic' },
  errBox:      { background: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' },
  successBanner:{ background: '#f0fff4', border: '1px solid #b2dfdb', color: '#1b5e20', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.9rem' },
  btnPrimary:  { backgroundColor: '#1e2d4a', color: 'white', border: 'none', borderRadius: '6px', padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnGhost:    { background: 'transparent', color: '#555', border: '1px solid #d4c5a9', borderRadius: '6px', padding: '0.55rem 1rem', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnGold:     { backgroundColor: '#b8860b', color: 'white', border: 'none', borderRadius: '6px', padding: '0.6rem 1.25rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  linkBtn:     { background: 'none', border: 'none', color: '#1b5e20', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, marginLeft: '0.5rem' },
  badgeLabel:  { fontSize: '0.7rem', fontWeight: 'bold', color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.07em' },
  previewTitle:{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1e2d4a', margin: '0.3rem 0 0' },
  metaGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1rem' },
  metaBox:     { background: '#f9f5ee', borderRadius: '6px', padding: '0.875rem', border: '1px solid #e8dfc8' },
  metaLabel:   { margin: '0 0 0.3rem', fontSize: '0.7rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase' },
  metaVal:     { margin: 0, fontSize: '0.875rem', color: '#1e2d4a' },
  tag:         { display: 'inline-block', background: '#f5f0e8', color: '#8b7355', fontSize: '0.78rem', padding: '0.2rem 0.65rem', borderRadius: '1rem', border: '1px solid #e8dfc8', marginRight: '0.4rem', marginBottom: '0.4rem' },
  hr:          { border: 'none', borderTop: '1px solid #e8dfc8', margin: '0 0 1.25rem' },
};
