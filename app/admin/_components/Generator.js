'use client';

import { useState, useEffect, useCallback } from 'react';
import { CATEGORIES } from '../../../lib/categories.js';

const S = {
  card:       { background: '#fff', border: '1px solid #e8dfc8', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1rem' },
  label:      { display: 'block', fontWeight: '600', color: '#1e2d4a', marginBottom: '0.35rem', fontSize: '0.85rem' },
  select:     { width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '0.9rem', fontFamily: 'inherit', background: '#fff', color: '#000' },
  input:      { width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#000' },
  btnPrimary: { background: '#1e2d4a', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.65rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnGhost:   { background: 'transparent', color: '#6b6b6b', border: '1px solid #d4c5a9', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnGold:    { background: '#dcf5e7', color: '#1b5e20', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.1rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnIdeas:   { background: '#ede9fe', color: '#4c1d95', border: 'none', borderRadius: '0.5rem', padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  errBox:     { background: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '0.5rem', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' },
  successBanner: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  metaBox:    { background: '#f9f5ee', borderRadius: '0.5rem', padding: '0.75rem 1rem' },
  metaLabel:  { margin: '0 0 0.25rem', fontSize: '0.72rem', fontWeight: '700', color: '#8b7355', textTransform: 'uppercase' },
  metaVal:    { margin: 0, fontSize: '0.875rem', color: '#1e2d4a' },
  infoBox:    { marginTop: '1rem', padding: '0.65rem 1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#0369a1' },
};

export default function Generator({ onSaved }) {
  const [topics,          setTopics]          = useState([]);
  const [topicsLoading,   setTopicsLoading]   = useState(true);
  const [topicsError,     setTopicsError]     = useState('');

  const [selCategory,     setSelCategory]     = useState('');
  const [selParentId,     setSelParentId]     = useState('');
  const [selChildId,      setSelChildId]      = useState('');
  const [selectedTopic,   setSelectedTopic]   = useState('');

  const [idea,            setIdea]            = useState('');
  const [usedIdeaId,      setUsedIdeaId]      = useState(null);
  const [ideas,           setIdeas]           = useState([]);
  const [ideasLoading,    setIdeasLoading]    = useState(false);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [ideasError,      setIdeasError]      = useState('');

  const [generating,  setGenerating]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [preview,     setPreview]     = useState(null);
  const [error,       setError]       = useState('');
  const [saved,       setSaved]       = useState(false);

  useEffect(() => {
    setTopicsLoading(true);
    fetch('/api/admin/topics')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => setTopics(Array.isArray(data) ? data : []))
      .catch(err => setTopicsError('Failed to load topics: ' + err.message))
      .finally(() => setTopicsLoading(false));
  }, []);

  const parentTopics = selCategory
    ? topics.filter(t => t.category === selCategory && !t.parent_id)
    : [];

  const childTopics = selParentId
    ? topics.filter(t => t.parent_id === selParentId)
    : [];

  const selectedTopicObj = topics.find(t => t.id === selectedTopic);

  useEffect(() => {
    const newId = selChildId || selParentId || '';
    if (newId === selectedTopic) return;
    setSelectedTopic(newId);
    setIdea(''); setUsedIdeaId(null); setError('');
    setIdeas([]); setPreview(null); setSaved(false);
    if (newId) fetchIdeasById(newId);
  }, [selChildId, selParentId]);

  async function fetchIdeasById(topicId) {
    if (!topicId) { setIdeas([]); return; }
    setIdeasLoading(true); setIdeasError('');
    try {
      const res  = await fetch(`/api/admin/ideas?topic_id=${topicId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load ideas');
      setIdeas(Array.isArray(data) ? data : []);
    } catch (err) {
      setIdeasError(err.message); setIdeas([]);
    } finally {
      setIdeasLoading(false);
    }
  }

  async function handleGenerateIdeas() {
    if (!selectedTopicObj) return;
    setGeneratingIdeas(true); setIdeasError('');
    try {
      const res  = await fetch('/api/admin/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: selectedTopicObj.id, topic_name: selectedTopicObj.name, category: selectedTopicObj.category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate ideas');
      await fetchIdeasById(selectedTopic);
    } catch (err) {
      setIdeasError(err.message);
    } finally {
      setGeneratingIdeas(false);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!selectedTopic) { setError('Please select a topic.'); return; }
    setError(''); setPreview(null); setSaved(false); setGenerating(true);
    try {
      const res  = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: selectedTopic, topicName: selectedTopicObj?.name || '', idea: idea.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(publish) {
    if (!preview) return;
    setSaving(true);
    try {
      const res  = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preview, status: publish ? 'published' : 'draft' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      if (usedIdeaId) {
        fetch(`/api/admin/ideas/${usedIdeaId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ used: true }),
        }).catch(() => {});
      }
      setTopics(prev => prev.map(t => t.id === selectedTopic ? { ...t, article_created: true } : t));
      setSaved(true); setPreview(null);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setSelCategory(''); setSelParentId(''); setSelChildId('');
    setSelectedTopic(''); setIdea(''); setPreview(null);
    setError(''); setSaved(false); setGenerating(false);
    setUsedIdeaId(null); setIdeas([]);
  }

  return (
    <div style={{ maxWidth: '860px' }}>

      {saved && (
        <div style={S.successBanner}>
          <span>✓ Article saved!</span>
          <button onClick={reset} style={{ ...S.btnGhost, fontSize: '0.85rem' }}>Generate another</button>
        </div>
      )}

      {!saved && (
        <>
          {/* ── Topic Selection ── */}
          <div style={S.card}>
            <h3 style={{ margin: '0 0 1.25rem', fontFamily: 'Georgia,serif', color: '#1e2d4a', fontSize: '1.05rem', fontWeight: 'bold' }}>
              Select Topic
            </h3>

            {topicsLoading && <p style={{ color: '#aaa', fontSize: '0.875rem', margin: 0 }}>Loading topics…</p>}
            {topicsError   && <p style={{ color: '#7b2020', fontSize: '0.875rem', margin: 0 }}>{topicsError}</p>}

            {!topicsLoading && !topicsError && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

                <div>
                  <label style={S.label}>Category</label>
                  <select
                    value={selCategory}
                    onChange={e => { setSelCategory(e.target.value); setSelParentId(''); setSelChildId(''); }}
                    style={S.select}
                  >
                    <option value="">— choose category —</option>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={S.label}>Parent Topic</label>
                  <select
                    value={selParentId}
                    onChange={e => { setSelParentId(e.target.value); setSelChildId(''); }}
                    style={S.select}
                    disabled={!selCategory}
                  >
                    <option value="">— choose parent topic —</option>
                    {parentTopics.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.article_created ? ' ✔' : ''}
                      </option>
                    ))}
                  </select>
                  {selCategory && parentTopics.length === 0 && (
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#aaa' }}>
                      No parent topics found — add topics without a parent_id in the Topics tab.
                    </p>
                  )}
                </div>

                <div>
                  <label style={S.label}>
                    Sub-topic{' '}
                    <span style={{ fontWeight: 400, color: '#aaa', fontSize: '0.78rem' }}>(optional)</span>
                  </label>
                  <select
                    value={selChildId}
                    onChange={e => setSelChildId(e.target.value)}
                    style={S.select}
                    disabled={!selParentId}
                  >
                    <option value="">— none, use parent —</option>
                    {childTopics.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.article_created ? ' ✔' : ''}
                      </option>
                    ))}
                  </select>
                  {selParentId && childTopics.length === 0 && (
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#aaa' }}>
                      No sub-topics — will generate for parent topic.
                    </p>
                  )}
                </div>

              </div>
            )}

            {selectedTopicObj && (
              <div style={S.infoBox}>
                <strong>Generating for:</strong> {selectedTopicObj.name}
                <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', color: '#6b6b6b' }}>
                  ({selectedTopicObj.category})
                </span>
                {selectedTopicObj.article_created && (
                  <span style={{ marginLeft: '0.75rem', color: '#15803d', fontWeight: '600', fontSize: '0.82rem' }}>
                    ✔ Article already created
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Generate form (only when topic selected) ── */}
          {selectedTopicObj && (
            <div style={S.card}>
              <form onSubmit={handleGenerate}>

                {/* Content Ideas panel */}
                <div style={{ background: '#faf7ee', border: '1px solid #e8dfc8', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontWeight: '700', color: '#1e2d4a', fontSize: '0.88rem' }}>
                      💡 Article Ideas
                      {ideas.length > 0 && (
                        <span style={{ marginLeft: '0.5rem', background: '#ede9fe', color: '#4c1d95', fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '1rem', fontWeight: '700' }}>
                          {ideas.length}
                        </span>
                      )}
                    </span>
                    <button
                      type="button" onClick={handleGenerateIdeas}
                      disabled={generatingIdeas || ideasLoading}
                      style={{ ...S.btnIdeas, opacity: (generatingIdeas || ideasLoading) ? 0.6 : 1 }}
                    >
                      {generatingIdeas ? '⟳ Generating…' : '✦ Generate Ideas'}
                    </button>
                  </div>

                  {ideasLoading && <p style={{ margin: 0, color: '#aaa', fontSize: '0.8rem' }}>Loading ideas…</p>}
                  {ideasError   && <p style={{ margin: 0, color: '#7b2020', fontSize: '0.8rem' }}>{ideasError}</p>}
                  {!ideasLoading && !ideasError && ideas.length === 0 && (
                    <p style={{ margin: 0, color: '#8b7355', fontSize: '0.8rem' }}>
                      No ideas yet for <strong>{selectedTopicObj.name}</strong> — click "Generate Ideas" to create some.
                    </p>
                  )}
                  {!ideasLoading && ideas.length > 0 && (
                    <ul style={{ margin: '0.5rem 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {ideas.map(item => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => { setIdea(item.title); setUsedIdeaId(item.id); }}
                            style={{
                              width: '100%', textAlign: 'left', padding: '0.45rem 0.75rem',
                              border: `1px solid ${usedIdeaId === item.id ? '#90caf9' : '#e8dfc8'}`,
                              borderRadius: '0.4rem',
                              background: usedIdeaId === item.id ? '#e8f4fd' : '#fff',
                              cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit',
                              color: '#1e2d4a', fontWeight: usedIdeaId === item.id ? '600' : '400',
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

                {/* Content idea input */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={S.label} htmlFor="idea-input">
                    Content Idea{' '}
                    <span style={{ fontWeight: 400, color: '#8b7355' }}>(optional — pick one above or type your own)</span>
                  </label>
                  <input
                    id="idea-input" type="text" value={idea}
                    onChange={e => { setIdea(e.target.value); setUsedIdeaId(null); }}
                    placeholder="e.g. how to forgive someone, overcoming doubt"
                    style={S.input}
                  />
                </div>

                {error && <div style={S.errBox}>{error}</div>}

                <button type="submit" disabled={generating} style={{ ...S.btnPrimary, opacity: generating ? 0.6 : 1 }}>
                  {generating ? '⟳ Generating…' : '✦ Generate Article'}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* Generating indicator */}
      {generating && (
        <div style={{ ...S.card, textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>✦</p>
          <p style={{ color: '#8b7355', margin: 0 }}>Writing article — usually 15–25 seconds…</p>
        </div>
      )}

      {/* Preview */}
      {preview && !generating && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Preview — not saved yet
              </span>
              <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.25rem', color: '#1e2d4a', margin: '0.4rem 0 0', lineHeight: 1.3 }}>
                {preview.title}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => handleSave(false)} disabled={saving} style={S.btnGhost}>
                {saving ? 'Saving…' : '📄 Save Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving} style={S.btnGold}>
                {saving ? 'Saving…' : '✓ Publish'}
              </button>
              <button onClick={reset} style={S.btnGhost}>Discard</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={S.metaBox}>
              <p style={S.metaLabel}>Meta Title ({preview.meta_title?.length || 0} chars)</p>
              <p style={S.metaVal}>{preview.meta_title}</p>
            </div>
            <div style={S.metaBox}>
              <p style={S.metaLabel}>Meta Description ({preview.meta_description?.length || 0} chars)</p>
              <p style={S.metaVal}>{preview.meta_description}</p>
            </div>
          </div>

          {preview.keywords?.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={S.metaLabel}>Keywords</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                {preview.keywords.map((k, i) => (
                  <span key={i} style={{ background: '#e8f4fd', color: '#1565c0', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid #bfdbfe' }}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          <details>
            <summary style={{ cursor: 'pointer', color: '#8b7355', fontSize: '0.85rem', userSelect: 'none', padding: '0.5rem 0' }}>
              Content Preview
            </summary>
            <div
              style={{ marginTop: '0.75rem', padding: '1.25rem', background: '#faf7f2', borderRadius: '0.5rem', border: '1px solid #e8dfc8', maxHeight: '400px', overflowY: 'auto', fontSize: '0.875rem', lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: preview.content || '' }}
            />
          </details>
        </div>
      )}

    </div>
  );
}
