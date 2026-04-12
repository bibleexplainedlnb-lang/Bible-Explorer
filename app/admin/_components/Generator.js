'use client';

import { useState, useEffect, useCallback } from 'react';

export default function Generator({ onSaved }) {
  const [topics,        setTopics]        = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError,   setTopicsError]   = useState('');

  const [selectedTopic, setSelectedTopic] = useState('');
  const [idea,          setIdea]          = useState('');
  const [usedIdeaId,    setUsedIdeaId]    = useState(null);

  const [ideas,         setIdeas]         = useState([]);
  const [ideasLoading,  setIdeasLoading]  = useState(false);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [ideasError,    setIdeasError]    = useState('');

  const [generating, setGenerating] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [preview,    setPreview]    = useState(null);
  const [error,      setError]      = useState('');
  const [saved,      setSaved]      = useState(false);

  useEffect(() => {
    setTopicsLoading(true);
    fetch('/api/admin/topics')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
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

  const fetchIdeas = useCallback(async (topicId) => {
    if (!topicId) { setIdeas([]); return; }
    setIdeasLoading(true);
    setIdeasError('');
    try {
      const res = await fetch(`/api/admin/ideas?topic_id=${topicId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load ideas');
      setIdeas(Array.isArray(data) ? data : []);
    } catch (err) {
      setIdeasError(err.message);
      setIdeas([]);
    } finally {
      setIdeasLoading(false);
    }
  }, []);

  function handleTopicChange(e) {
    const id = e.target.value;
    console.log('Selected topic:', id);
    setSelectedTopic(id);
    setIdea('');
    setUsedIdeaId(null);
    setError('');
    setIdeas([]);
    if (id) fetchIdeas(id);
  }

  async function handleGenerateIdeas() {
    const topic = topics.find(t => t.id === selectedTopic);
    if (!topic) return;
    setGeneratingIdeas(true);
    setIdeasError('');
    try {
      const res = await fetch('/api/admin/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id:   topic.id,
          topic_name: topic.name,
          category:   topic.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate ideas');
      await fetchIdeas(selectedTopic);
    } catch (err) {
      setIdeasError(err.message);
    } finally {
      setGeneratingIdeas(false);
    }
  }

  function pickIdea(ideaItem) {
    setIdea(ideaItem.title);
    setUsedIdeaId(ideaItem.id);
  }

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

      if (usedIdeaId) {
        fetch(`/api/admin/ideas/${usedIdeaId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ used: true }),
        }).catch(() => {});
      }

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
    setUsedIdeaId(null); setIdeas([]);
  }

  const selectedTopicObj = topics.find(t => t.id === selectedTopic);
  const isSaving = saving;

  return (
    <div style={{ maxWidth: '820px' }}>

      {saved && (
        <div style={s.successBanner}>
          Article saved!{' '}
          <button onClick={reset} style={s.linkBtn}>Generate another</button>
        </div>
      )}

      {!saved && (
        <div style={s.card}>
          <form onSubmit={handleGenerate}>

            {/* ── Topic selector ── */}
            <div style={s.field}>
              <label style={s.label} htmlFor="topic-select">Topic</label>

              {topicsLoading && <div style={s.placeholder}>Loading topics…</div>}
              {!topicsLoading && topicsError && <div style={s.errBox}>{topicsError}</div>}

              {!topicsLoading && !topicsError && (
                <select
                  id="topic-select"
                  value={selectedTopic}
                  onChange={handleTopicChange}
                  style={{
                    width: '100%', padding: '12px', cursor: 'pointer',
                    backgroundColor: 'white', color: '#000',
                    border: '1px solid #d4c5a9', borderRadius: '6px',
                    fontSize: '1rem', fontFamily: 'inherit',
                    appearance: 'auto', WebkitAppearance: 'auto',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                >
                  <option value="">Select a topic</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              )}

              {!topicsLoading && !topicsError && topics.length > 0 && (
                <p style={s.hint}>{topics.length} topics available</p>
              )}
            </div>

            {/* ── Content Ideas panel ── */}
            {selectedTopic && (
              <div style={s.ideasPanel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={s.ideasHeading}>
                    💡 Article Ideas
                    {ideas.length > 0 && <span style={s.ideaCount}>{ideas.length} unused</span>}
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateIdeas}
                    disabled={generatingIdeas || ideasLoading}
                    style={{ ...s.btnIdeas, opacity: (generatingIdeas || ideasLoading) ? 0.6 : 1 }}
                  >
                    {generatingIdeas ? '⟳ Generating…' : '✦ Generate Ideas'}
                  </button>
                </div>

                {ideasLoading && <p style={s.ideasMuted}>Loading ideas…</p>}
                {ideasError  && <p style={{ ...s.ideasMuted, color: '#7b2020' }}>{ideasError}</p>}

                {!ideasLoading && !ideasError && ideas.length === 0 && (
                  <p style={s.ideasMuted}>
                    No ideas yet for <strong>{selectedTopicObj?.name}</strong>. Click "✦ Generate Ideas" to create some.
                  </p>
                )}

                {!ideasLoading && ideas.length > 0 && (
                  <ul style={s.ideaList}>
                    {ideas.map(item => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => pickIdea(item)}
                          style={{
                            ...s.ideaItem,
                            background: usedIdeaId === item.id ? '#e8f4fd' : '#f5f0e8',
                            borderColor: usedIdeaId === item.id ? '#90caf9' : '#e8dfc8',
                            fontWeight:  usedIdeaId === item.id ? '600' : '400',
                          }}
                        >
                          {usedIdeaId === item.id && <span style={{ color: '#1565c0', marginRight: '0.4rem' }}>✓</span>}
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* ── Content idea input ── */}
            <div style={s.field}>
              <label style={s.label} htmlFor="idea-input">
                Content Idea{' '}
                <span style={{ fontWeight: 400, color: '#8b7355' }}>(optional — click idea above or type your own)</span>
              </label>
              <input
                id="idea-input"
                type="text"
                value={idea}
                onChange={e => { setIdea(e.target.value); setUsedIdeaId(null); }}
                placeholder="e.g. how to forgive someone, overcoming doubt"
                style={s.input}
              />
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
              <button onClick={() => handleSave(false)} disabled={isSaving} style={s.btnGhost}>
                {isSaving ? 'Saving…' : '📄 Save Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={isSaving} style={s.btnGold}>
                {isSaving ? 'Saving…' : '✓ Publish'}
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
            <button onClick={() => handleSave(false)} disabled={isSaving} style={s.btnGhost}>📄 Save Draft</button>
            <button onClick={() => handleSave(true)} disabled={isSaving} style={s.btnGold}>✓ Publish Now</button>
            <button onClick={reset} style={s.btnGhost}>Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  card:         { background: '#fff', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2rem' },
  field:        { marginBottom: '1.25rem' },
  label:        { display: 'block', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.45rem', fontSize: '0.9rem' },
  input:        { display: 'block', width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '6px', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#000', backgroundColor: '#fff' },
  hint:         { margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#8b7355' },
  placeholder:  { padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '6px', fontSize: '0.9rem', color: '#8b7355', background: '#f9f5ee', fontStyle: 'italic' },
  errBox:       { background: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' },
  successBanner:{ background: '#f0fff4', border: '1px solid #b2dfdb', color: '#1b5e20', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.9rem' },
  btnPrimary:   { backgroundColor: '#1e2d4a', color: 'white', border: 'none', borderRadius: '6px', padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnGhost:     { background: 'transparent', color: '#555', border: '1px solid #d4c5a9', borderRadius: '6px', padding: '0.55rem 1rem', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnGold:      { backgroundColor: '#b8860b', color: 'white', border: 'none', borderRadius: '6px', padding: '0.6rem 1.25rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnIdeas:     { backgroundColor: '#2c4270', color: 'white', border: 'none', borderRadius: '6px', padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  linkBtn:      { background: 'none', border: 'none', color: '#1b5e20', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, marginLeft: '0.5rem' },
  ideasPanel:   { background: '#f5f0e8', border: '1px solid #e8dfc8', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.25rem' },
  ideasHeading: { fontSize: '0.85rem', fontWeight: '700', color: '#1e2d4a', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  ideaCount:    { background: '#1e2d4a', color: 'white', fontSize: '0.7rem', fontWeight: '700', padding: '0.1rem 0.5rem', borderRadius: '1rem' },
  ideasMuted:   { margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#8b7355' },
  ideaList:     { listStyle: 'none', margin: '0.5rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  ideaItem:     { width: '100%', textAlign: 'left', padding: '0.55rem 0.9rem', border: '1px solid #e8dfc8', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', color: '#1e2d4a', transition: 'all 0.1s' },
  badgeLabel:   { fontSize: '0.7rem', fontWeight: 'bold', color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.07em' },
  previewTitle: { fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1e2d4a', margin: '0.3rem 0 0' },
  metaGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1rem' },
  metaBox:      { background: '#f9f5ee', borderRadius: '6px', padding: '0.875rem', border: '1px solid #e8dfc8' },
  metaLabel:    { margin: '0 0 0.3rem', fontSize: '0.7rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase' },
  metaVal:      { margin: 0, fontSize: '0.875rem', color: '#1e2d4a' },
  tag:          { display: 'inline-block', background: '#f5f0e8', color: '#8b7355', fontSize: '0.78rem', padding: '0.2rem 0.65rem', borderRadius: '1rem', border: '1px solid #e8dfc8', marginRight: '0.4rem', marginBottom: '0.4rem' },
  hr:           { border: 'none', borderTop: '1px solid #e8dfc8', margin: '0 0 1.25rem' },
};
