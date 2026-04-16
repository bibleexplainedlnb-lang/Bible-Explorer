'use client';

import { useState, useEffect, useCallback } from 'react';
import { CATEGORIES } from '../../../lib/categories.js';

const FILTERS = [
  { key: 'all',         label: 'All' },
  { key: 'not-created', label: 'Not Created' },
  { key: 'created',     label: 'Created' },
  { key: 'pillars',     label: 'Pillars' },
];

function articleUrl(slug, category) {
  return `/${category}/${slug}/`;
}

export default function Generator({ onSaved }) {
  const [topics,          setTopics]          = useState([]);
  const [topicsLoading,   setTopicsLoading]   = useState(true);
  const [topicsError,     setTopicsError]     = useState('');
  const [activeTab,       setActiveTab]       = useState(CATEGORIES[0].value);
  const [topicFilter,     setTopicFilter]     = useState('all'); // all | not-created | created | pillars
  const [regenConfirm,    setRegenConfirm]    = useState(null);

  // Map of topicId → { slug, category } for "View Article" links
  const [articleSlugs,    setArticleSlugs]    = useState({});
  const [viewLoading,     setViewLoading]     = useState(null); // topicId being looked up

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

  const fetchIdeas = useCallback(async (topicId) => {
    if (!topicId) { setIdeas([]); return; }
    setIdeasLoading(true); setIdeasError('');
    try {
      const res = await fetch(`/api/admin/ideas?topic_id=${topicId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load ideas');
      setIdeas(Array.isArray(data) ? data : []);
    } catch (err) {
      setIdeasError(err.message); setIdeas([]);
    } finally {
      setIdeasLoading(false);
    }
  }, []);

  function handleTopicClick(topic) {
    if (topic.id === selectedTopic) return;
    if (topic.article_created) {
      setRegenConfirm(topic);
      return;
    }
    selectTopic(topic.id);
  }

  function selectTopic(id) {
    setSelectedTopic(id);
    setIdea(''); setUsedIdeaId(null); setError('');
    setIdeas([]);
    if (id) fetchIdeas(id);
  }

  function confirmRegen() {
    if (!regenConfirm) return;
    selectTopic(regenConfirm.id);
    setRegenConfirm(null);
  }

  function clearTopic() {
    setSelectedTopic(''); setIdea(''); setUsedIdeaId(null);
    setError(''); setIdeas([]); setPreview(null); setRegenConfirm(null);
  }

  async function handleViewArticle(topic) {
    // Already cached
    if (articleSlugs[topic.id]) {
      const { slug, category } = articleSlugs[topic.id];
      window.open(articleUrl(slug, category), '_blank');
      return;
    }
    setViewLoading(topic.id);
    try {
      const res = await fetch(`/api/admin/articles?topic_id=${topic.id}&limit=1`);
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length > 0) {
        const art = data[0];
        const cat = art.topics?.category || topic.category;
        setArticleSlugs(prev => ({ ...prev, [topic.id]: { slug: art.slug, category: cat } }));
        window.open(articleUrl(art.slug, cat), '_blank');
      } else {
        alert('Article not found. It may not be published yet.');
      }
    } catch {
      alert('Could not load article.');
    } finally {
      setViewLoading(null);
    }
  }

  async function handleGenerateIdeas() {
    const topic = topics.find(t => t.id === selectedTopic);
    if (!topic) return;
    setGeneratingIdeas(true); setIdeasError('');
    try {
      const res = await fetch('/api/admin/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic_id: topic.id, topic_name: topic.name, category: topic.category }),
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
        body: JSON.stringify({ topicId: selectedTopic, topicName: topic?.name || '', category: topic?.category || '', idea: idea.trim() }),
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
    const topic = topics.find(t => t.id === selectedTopic);
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

      // Cache the slug so "View Article" works immediately
      if (preview.slug && topic) {
        setArticleSlugs(prev => ({ ...prev, [selectedTopic]: { slug: preview.slug, category: topic.category } }));
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
    setSelectedTopic(''); setIdea(''); setPreview(null);
    setError(''); setSaved(false); setGenerating(false);
    setUsedIdeaId(null); setIdeas([]); setRegenConfirm(null);
  }

  const selectedTopicObj = topics.find(t => t.id === selectedTopic);

  const tabTopics = topics.filter(t => t.category === activeTab);

  // Apply filter
  const filteredTopics = tabTopics.filter(t => {
    if (topicFilter === 'not-created') return !t.article_created;
    if (topicFilter === 'created')     return !!t.article_created;
    if (topicFilter === 'pillars')     return !!t.is_pillar;
    return true; // 'all'
  });

  // Sort: 1. Pillars  2. Not Created  3. Created  (alpha within each group)
  const sortedTopics = [...filteredTopics].sort((a, b) => {
    const rank = t => t.is_pillar ? 0 : !t.article_created ? 1 : 2;
    const rDiff = rank(a) - rank(b);
    if (rDiff !== 0) return rDiff;
    return a.name.localeCompare(b.name);
  });

  const createdCount   = tabTopics.filter(t => t.article_created).length;
  const uncreatedCount = tabTopics.filter(t => !t.article_created).length;
  const pillarCount    = tabTopics.filter(t => t.is_pillar).length;

  return (
    <div style={{ maxWidth: '860px' }}>
      {saved && (
        <div style={s.successBanner}>
          Article saved!{' '}
          {selectedTopicObj && articleSlugs[selectedTopicObj.id] && (
            <a
              href={articleUrl(articleSlugs[selectedTopicObj.id].slug, articleSlugs[selectedTopicObj.id].category)}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#1b5e20', fontWeight: 'bold', marginRight: '0.75rem' }}
            >
              View Article →
            </a>
          )}
          <button onClick={reset} style={s.linkBtn}>Generate another</button>
        </div>
      )}

      {!saved && (
        <>
          {/* ── Topic selector ── */}
          <div style={{ ...s.card, marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontWeight: '700', color: '#1e2d4a', fontSize: '0.9rem' }}>
                {selectedTopicObj
                  ? <>Selected: <span style={{ color: '#b8860b' }}>{selectedTopicObj.name}</span>{selectedTopicObj.is_pillar && <span style={s.pillarBadge}>★ Pillar</span>}</>
                  : 'Select a Topic'}
              </span>
              {selectedTopicObj && (
                <button type="button" onClick={clearTopic} style={s.btnGhost}>Change topic</button>
              )}
            </div>

            {topicsLoading && <div style={s.placeholder}>Loading topics…</div>}
            {topicsError  && <div style={s.errBox}>{topicsError}</div>}

            {!topicsLoading && !topicsError && (
              <>
                {/* Category tabs */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                  {CATEGORIES.map(c => {
                    const tCount = topics.filter(t => t.category === c.value).length;
                    return (
                      <button key={c.value} type="button" onClick={() => setActiveTab(c.value)} style={s.tab(activeTab === c.value)}>
                        {c.label}{tCount > 0 && <span style={{ opacity: 0.65, marginLeft: '0.3rem', fontSize: '0.7rem' }}>{tCount}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Filter buttons */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
                  {FILTERS.map(f => {
                    let badge = null;
                    if (f.key === 'all')         badge = tabTopics.length;
                    if (f.key === 'not-created') badge = uncreatedCount;
                    if (f.key === 'created')     badge = createdCount;
                    if (f.key === 'pillars')     badge = pillarCount;
                    const isActive = topicFilter === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setTopicFilter(f.key)}
                        style={{
                          padding: '0.3rem 0.75rem', borderRadius: '2rem', fontSize: '0.78rem', fontWeight: '600',
                          cursor: 'pointer', border: isActive ? '2px solid #1e2d4a' : '1px solid #d4c5a9',
                          fontFamily: 'inherit',
                          background: isActive ? '#1e2d4a' : '#f5f0e8',
                          color:      isActive ? 'white'   : '#5a4a35',
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                        }}
                      >
                        {f.key === 'created'     && <span style={{ color: isActive ? '#6ee7b7' : '#15803d' }}>✔</span>}
                        {f.key === 'pillars'     && <span style={{ color: isActive ? '#ffd700' : '#b8860b' }}>★</span>}
                        {f.label}
                        {badge !== null && (
                          <span style={{
                            fontSize: '0.68rem', fontWeight: '700',
                            background: isActive ? 'rgba(255,255,255,0.25)' : '#d4c5a9',
                            color: isActive ? 'white' : '#5a4a35',
                            padding: '0 0.4rem', borderRadius: '1rem', lineHeight: '1.4',
                          }}>
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Topic grid */}
                {sortedTopics.length === 0 ? (
                  <p style={{ margin: 0, color: '#aaa', fontSize: '0.875rem', padding: '0.75rem 0' }}>
                    {tabTopics.length === 0
                      ? `No ${CATEGORIES.find(c => c.value === activeTab)?.label} topics yet. Add some in the Topics tab.`
                      : `No topics match the "${FILTERS.find(f => f.key === topicFilter)?.label}" filter.`}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {sortedTopics.map(topic => {
                      const isSel     = topic.id === selectedTopic;
                      const isCreated = !!topic.article_created;
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => handleTopicClick(topic)}
                          title={isCreated ? 'Article already created — click to regenerate' : ''}
                          style={{
                            padding: '0.4rem 0.85rem', borderRadius: '2rem', fontSize: '0.82rem', fontWeight: '600',
                            cursor: 'pointer', fontFamily: 'inherit',
                            opacity: isCreated && !isSel ? 0.6 : 1,
                            border: isSel ? '2px solid #1e2d4a' : isCreated ? '1px solid #6ee7b7' : '1px solid #d4c5a9',
                            background: isSel ? '#1e2d4a' : isCreated ? '#f0fdf4' : '#fff',
                            color:      isSel ? 'white'   : isCreated ? '#15803d' : '#1e2d4a',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                          }}
                        >
                          {topic.is_pillar && <span style={{ color: isSel ? '#ffd700' : '#b8860b' }}>★</span>}
                          {topic.name}
                          {isCreated && (
                            <span style={{
                              fontSize: '0.68rem', fontWeight: '700', background: '#dcfce7',
                              color: '#15803d', padding: '0.05rem 0.4rem', borderRadius: '1rem',
                              border: '1px solid #a7f3d0',
                            }}>
                              ✔ Created
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Regenerate / View Article confirm */}
                {regenConfirm && (
                  <div style={s.warnPanel}>
                    <p style={{ margin: '0 0 0.5rem', fontWeight: '700', color: '#1e2d4a', fontSize: '0.95rem' }}>
                      Article already exists for <span style={{ color: '#b8860b' }}>{regenConfirm.name}</span>
                    </p>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#5a4a35' }}>
                      Do you want to regenerate a new article for this topic?
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button type="button" onClick={confirmRegen} style={s.btnDanger}>
                        ↺ Regenerate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewArticle(regenConfirm)}
                        disabled={viewLoading === regenConfirm.id}
                        style={{ ...s.btnGreen, opacity: viewLoading === regenConfirm.id ? 0.6 : 1 }}
                      >
                        {viewLoading === regenConfirm.id ? 'Loading…' : '↗ View Article'}
                      </button>
                      <button type="button" onClick={() => setRegenConfirm(null)} style={s.btnGhost}>
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Form (only when topic selected) ── */}
          {selectedTopicObj && (
            <div style={s.card}>
              <form onSubmit={handleGenerate}>

                {/* ── Content Ideas panel ── */}
                <div style={s.ideasPanel}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={s.ideasHeading}>
                      💡 Article Ideas
                      {ideas.length > 0 && <span style={s.ideaCount}>{ideas.length} unused</span>}
                    </span>
                    <button
                      type="button" onClick={handleGenerateIdeas}
                      disabled={generatingIdeas || ideasLoading}
                      style={{ ...s.btnIdeas, opacity: (generatingIdeas || ideasLoading) ? 0.6 : 1 }}
                    >
                      {generatingIdeas ? '⟳ Generating…' : '✦ Generate Ideas'}
                    </button>
                  </div>

                  {ideasLoading && <p style={s.ideasMuted}>Loading ideas…</p>}
                  {ideasError   && <p style={{ ...s.ideasMuted, color: '#7b2020' }}>{ideasError}</p>}

                  {!ideasLoading && !ideasError && ideas.length === 0 && (
                    <p style={s.ideasMuted}>
                      No ideas yet for <strong>{selectedTopicObj.name}</strong>. Click "✦ Generate Ideas" to create some.
                    </p>
                  )}

                  {!ideasLoading && ideas.length > 0 && (
                    <ul style={s.ideaList}>
                      {ideas.map(item => (
                        <li key={item.id}>
                          <button
                            type="button" onClick={() => pickIdea(item)}
                            style={{
                              ...s.ideaItem,
                              background:  usedIdeaId === item.id ? '#e8f4fd' : '#f5f0e8',
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

                {/* ── Content idea input ── */}
                <div style={s.field}>
                  <label style={s.label} htmlFor="idea-input">
                    Content Idea{' '}
                    <span style={{ fontWeight: 400, color: '#8b7355' }}>(optional — click idea above or type your own)</span>
                  </label>
                  <input
                    id="idea-input" type="text" value={idea}
                    onChange={e => { setIdea(e.target.value); setUsedIdeaId(null); }}
                    placeholder="e.g. how to forgive someone, overcoming doubt"
                    style={s.input}
                  />
                </div>

                {error && <div style={s.errBox}>{error}</div>}

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="submit" disabled={generating}
                    style={{ ...s.btnPrimary, opacity: generating ? 0.6 : 1 }}
                  >
                    {generating ? '⟳ Generating…' : '✦ Generate Article'}
                  </button>
                  {selectedTopicObj.article_created && (
                    <button
                      type="button"
                      onClick={() => handleViewArticle(selectedTopicObj)}
                      disabled={viewLoading === selectedTopicObj.id}
                      style={{ ...s.btnGreen, opacity: viewLoading === selectedTopicObj.id ? 0.6 : 1 }}
                    >
                      {viewLoading === selectedTopicObj.id ? 'Loading…' : '↗ View Existing Article'}
                    </button>
                  )}
                  {preview && !generating && (
                    <button type="button" onClick={reset} style={s.btnGhost}>Start over</button>
                  )}
                </div>
              </form>
            </div>
          )}
        </>
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
              <button onClick={() => handleSave(false)} disabled={saving} style={s.btnGhost}>{saving ? 'Saving…' : '📄 Save Draft'}</button>
              <button onClick={() => handleSave(true)}  disabled={saving} style={s.btnGold}>{saving  ? 'Saving…' : '✓ Publish'}</button>
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
            className="prose-content"
            style={{ lineHeight: 1.8, color: '#2a2a2a', fontSize: '0.95rem' }}
            dangerouslySetInnerHTML={{ __html: preview.content }}
          />

          {error && <div style={{ ...s.errBox, marginTop: '1rem' }}>{error}</div>}

          <hr style={{ ...s.hr, margin: '1.5rem 0' }} />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => handleSave(false)} disabled={saving} style={s.btnGhost}>📄 Save Draft</button>
            <button onClick={() => handleSave(true)}  disabled={saving} style={s.btnGold}>✓ Publish Now</button>
            <button onClick={reset} style={s.btnGhost}>Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  card:         { background: '#fff', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '1.5rem' },
  field:        { marginBottom: '1.25rem' },
  label:        { display: 'block', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.45rem', fontSize: '0.9rem' },
  input:        { display: 'block', width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '6px', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#000', backgroundColor: '#fff' },
  placeholder:  { padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '6px', fontSize: '0.9rem', color: '#8b7355', background: '#f9f5ee', fontStyle: 'italic' },
  errBox:       { background: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' },
  warnPanel:    { background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '1rem 1.25rem', marginTop: '0.875rem' },
  successBanner:{ background: '#f0fff4', border: '1px solid #b2dfdb', color: '#1b5e20', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  tab:          (active) => ({
    padding: '0.3rem 0.75rem', borderRadius: '2rem', fontSize: '0.78rem', fontWeight: '600',
    cursor: 'pointer', border: 'none', fontFamily: 'inherit',
    background: active ? '#1e2d4a' : '#f5f0e8',
    color:      active ? 'white'   : '#5a4a35',
  }),
  pillarBadge:  { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: '#fff3cd', color: '#856404', fontSize: '0.7rem', fontWeight: '700', padding: '0.1rem 0.5rem', borderRadius: '1rem', border: '1px solid #ffc107', marginLeft: '0.5rem' },
  btnPrimary:   { backgroundColor: '#1e2d4a', color: 'white', border: 'none', borderRadius: '6px', padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnGhost:     { background: 'transparent', color: '#555', border: '1px solid #d4c5a9', borderRadius: '6px', padding: '0.55rem 1rem', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnGold:      { backgroundColor: '#b8860b', color: 'white', border: 'none', borderRadius: '6px', padding: '0.6rem 1.25rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnDanger:    { backgroundColor: '#7b2020', color: 'white', border: 'none', borderRadius: '6px', padding: '0.55rem 1rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnGreen:     { backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '6px', padding: '0.55rem 1rem', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnIdeas:     { backgroundColor: '#2c4270', color: 'white', border: 'none', borderRadius: '6px', padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  linkBtn:      { background: 'none', border: 'none', color: '#1b5e20', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 'inherit', padding: 0 },
  ideasPanel:   { background: '#f5f0e8', border: '1px solid #e8dfc8', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.25rem' },
  ideasHeading: { fontSize: '0.85rem', fontWeight: '700', color: '#1e2d4a', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  ideaCount:    { background: '#1e2d4a', color: 'white', fontSize: '0.7rem', fontWeight: '700', padding: '0.1rem 0.5rem', borderRadius: '1rem' },
  ideasMuted:   { margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#8b7355' },
  ideaList:     { listStyle: 'none', margin: '0.5rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  ideaItem:     { width: '100%', textAlign: 'left', padding: '0.55rem 0.9rem', border: '1px solid #e8dfc8', borderRadius: '6px', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit', color: '#1e2d4a' },
  badgeLabel:   { fontSize: '0.7rem', fontWeight: 'bold', color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.07em' },
  previewTitle: { fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#1e2d4a', margin: '0.3rem 0 0' },
  metaGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1rem' },
  metaBox:      { background: '#f9f5ee', borderRadius: '6px', padding: '0.875rem', border: '1px solid #e8dfc8' },
  metaLabel:    { margin: '0 0 0.3rem', fontSize: '0.7rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase' },
  metaVal:      { margin: 0, fontSize: '0.875rem', color: '#1e2d4a' },
  tag:          { display: 'inline-block', background: '#f5f0e8', color: '#8b7355', fontSize: '0.78rem', padding: '0.2rem 0.65rem', borderRadius: '1rem', border: '1px solid #e8dfc8', marginRight: '0.4rem', marginBottom: '0.4rem' },
  hr:           { border: 'none', borderTop: '1px solid #e8dfc8', margin: '0 0 1.25rem' },
};
