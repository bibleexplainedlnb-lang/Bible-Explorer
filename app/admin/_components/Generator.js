'use client';

import { useState, useEffect } from 'react';

export default function Generator({ onSaved }) {
  const [topics,   setTopics]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [topicsErr,setTopicsErr]= useState('');

  const [topicId,  setTopicId]  = useState('');
  const [idea,     setIdea]     = useState('');

  const [genStatus, setGenStatus] = useState('idle');
  const [preview,   setPreview]   = useState(null);
  const [editing,   setEditing]   = useState(false);
  const [editData,  setEditData]  = useState({});
  const [saveStatus,setSaveStatus]= useState('idle');
  const [error,     setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/topics')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        console.log('[Generator] topics:', d);
        if (Array.isArray(d) && d.length > 0) {
          setTopics(d);
        } else {
          setTopicsErr('No topics found. Add topics in the Topics tab first.');
        }
      })
      .catch(err => {
        console.error('[Generator] topics error:', err);
        setTopicsErr(`Could not load topics: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedTopic = topics.find(t => t.id === topicId);

  const grouped = topics.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  async function handleGenerate(e) {
    e.preventDefault();
    if (!topicId) { setError('Please select a topic.'); return; }
    setError(''); setPreview(null); setEditing(false); setGenStatus('generating');
    try {
      const res = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          topicName: selectedTopic?.name,
          idea:      idea.trim(),
          category:  selectedTopic?.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Generation failed.');
        setGenStatus('idle');
        return;
      }
      setPreview(data);
      setEditData({
        title:            data.title,
        meta_title:       data.meta_title,
        meta_description: data.meta_description,
        content:          data.content,
      });
      setGenStatus('preview');
    } catch (err) {
      setError(err.message);
      setGenStatus('idle');
    }
  }

  async function handleSave(publish = false) {
    if (!preview) return;
    setSaveStatus('saving');
    const payload = {
      ...preview,
      ...(editing ? editData : {}),
      status: publish ? 'published' : 'draft',
    };
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Save failed.');
        setSaveStatus('idle');
        return;
      }
      setSaveStatus('saved');
      setPreview(data);
      onSaved?.();
    } catch (err) {
      setError(err.message);
      setSaveStatus('idle');
    }
  }

  function reset() {
    setGenStatus('idle'); setPreview(null);
    setEditing(false); setError(''); setIdea(''); setTopicId('');
    setSaveStatus('idle');
  }

  const isSaving = saveStatus === 'saving';

  return (
    <div>
      {/* ── Saved confirmation ── */}
      {saveStatus === 'saved' && preview && (
        <div style={styles.banner('#f0fff4','#b2dfdb','#1b5e20')}>
          <strong>Saved!</strong> &ldquo;{preview.title}&rdquo; — status: {preview.status}
          <button onClick={reset} style={{ ...styles.btn, marginLeft:'1rem', padding:'0.3rem 0.9rem', fontSize:'0.85rem' }}>
            Generate another
          </button>
        </div>
      )}

      {/* ── Topic + Idea form ── */}
      {saveStatus !== 'saved' && (
        <div style={styles.card}>
          <form onSubmit={handleGenerate}>

            {/* Topic select */}
            <div style={{ marginBottom:'1.25rem' }}>
              <label htmlFor="topic-select" style={styles.label}>Topic</label>

              {loading && (
                <div style={styles.selectPlaceholder}>Loading topics…</div>
              )}

              {!loading && topicsErr && (
                <div style={styles.selectPlaceholder}>{topicsErr}</div>
              )}

              {!loading && !topicsErr && (
                <select
                  id="topic-select"
                  value={topicId}
                  onChange={e => {
                    console.log('[Generator] topic selected:', e.target.value);
                    setTopicId(e.target.value);
                    setError('');
                  }}
                  style={styles.select}
                >
                  <option value="">— Select a topic —</option>
                  {Object.entries(grouped).map(([cat, list]) => (
                    <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                      {list.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}

              {!loading && !topicsErr && topics.length > 0 && (
                <p style={{ margin:'0.3rem 0 0', fontSize:'0.78rem', color:'#8b7355' }}>
                  {topics.length} topic{topics.length !== 1 ? 's' : ''} available
                </p>
              )}
            </div>

            {/* Content idea */}
            <div style={{ marginBottom:'1.5rem' }}>
              <label htmlFor="idea-input" style={styles.label}>
                Content Idea{' '}
                <span style={{ fontWeight: 400, color: '#8b7355' }}>(optional)</span>
              </label>
              <input
                id="idea-input"
                type="text"
                value={idea}
                onChange={e => setIdea(e.target.value)}
                placeholder="e.g. how to forgive someone who hurt you, overcoming doubt"
                style={styles.input}
              />
              <p style={{ margin:'0.3rem 0 0', fontSize:'0.78rem', color:'#8b7355' }}>
                A keyword or angle to guide the article. Leave blank to let AI decide.
              </p>
            </div>

            {error && <div style={styles.banner('#fff0f0','#f5c6c6','#7b2020')}>{error}</div>}

            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
              <button
                type="submit"
                disabled={genStatus === 'generating' || loading}
                style={{ ...styles.btn, opacity: (genStatus === 'generating' || loading) ? 0.65 : 1 }}
              >
                {genStatus === 'generating' ? '⟳ Generating…' : '✦ Generate Article'}
              </button>
              {genStatus === 'preview' && (
                <button type="button" onClick={reset} style={styles.btnGhost}>Start over</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── Generating spinner ── */}
      {genStatus === 'generating' && (
        <div style={{ ...styles.card, textAlign:'center', padding:'3rem', marginTop:'1.5rem' }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>✦</div>
          <p style={{ margin:0, color:'#8b7355' }}>Writing article — usually 15–25 seconds…</p>
        </div>
      )}

      {/* ── Preview ── */}
      {genStatus === 'preview' && preview && (
        <div style={{ ...styles.card, marginTop:'1.5rem' }}>
          {/* Preview header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
            <div style={{ flex:1 }}>
              <span style={{ fontSize:'0.7rem', fontWeight:'bold', color:'#b8860b', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                Preview — not saved yet
              </span>
              {editing ? (
                <input
                  value={editData.title}
                  onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                  style={{ ...styles.input, marginTop:'0.3rem', fontWeight:'bold', fontSize:'1.1rem' }}
                />
              ) : (
                <h2 style={{ margin:'0.3rem 0 0', fontFamily:'Georgia,serif', fontSize:'1.4rem', color:'#1e2d4a' }}>
                  {preview.title}
                </h2>
              )}
            </div>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', flexShrink:0 }}>
              <button onClick={() => setSaveStatus('saving') || handleSave(false)} disabled={isSaving} style={styles.btnGhost}>
                {isSaving ? 'Saving…' : '📄 Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={isSaving} style={styles.btnGold}>
                {isSaving ? 'Saving…' : '✓ Publish'}
              </button>
              <button onClick={() => setEditing(e => !e)} style={styles.btnGhost}>
                {editing ? 'View' : '✎ Edit'}
              </button>
              <button onClick={handleGenerate} style={styles.btnGhost}>↻ Regen</button>
            </div>
          </div>

          <hr style={styles.hr} />

          {/* SEO fields */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem', marginBottom:'1.25rem' }}>
            <MetaBox label={`Meta Title (${(editing ? editData.meta_title : preview.meta_title)?.length || 0} chars)`}>
              {editing
                ? <input value={editData.meta_title} onChange={e => setEditData(d => ({ ...d, meta_title: e.target.value }))} style={styles.inputSm} />
                : <p style={styles.metaText}>{preview.meta_title}</p>}
            </MetaBox>
            <MetaBox label={`Meta Description (${(editing ? editData.meta_description : preview.meta_description)?.length || 0} chars)`}>
              {editing
                ? <textarea value={editData.meta_description} onChange={e => setEditData(d => ({ ...d, meta_description: e.target.value }))} rows={3} style={{ ...styles.inputSm, resize:'vertical' }} />
                : <p style={styles.metaText}>{preview.meta_description}</p>}
            </MetaBox>
          </div>

          {/* Keywords */}
          <div style={{ marginBottom:'1.25rem' }}>
            <p style={styles.metaLabel}>Keywords</p>
            <div>
              {(preview.keywords || []).map(k => (
                <span key={k} style={styles.tag}>{k}</span>
              ))}
            </div>
          </div>

          <hr style={styles.hr} />

          <p style={styles.metaLabel}>Article Content</p>
          {editing ? (
            <textarea
              value={editData.content}
              onChange={e => setEditData(d => ({ ...d, content: e.target.value }))}
              rows={22}
              style={{ ...styles.input, fontSize:'0.875rem', resize:'vertical', lineHeight:1.7 }}
            />
          ) : (
            <div
              style={{ lineHeight:1.8, color:'#2a2a2a', fontSize:'0.95rem' }}
              dangerouslySetInnerHTML={{ __html: editing ? editData.content : preview.content }}
            />
          )}

          {error && <div style={{ ...styles.banner('#fff0f0','#f5c6c6','#7b2020'), marginTop:'1rem' }}>{error}</div>}

          <hr style={{ ...styles.hr, margin:'1.5rem 0' }} />
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button onClick={() => handleSave(false)} disabled={isSaving} style={styles.btnGhost}>📄 Save Draft</button>
            <button onClick={() => handleSave(true)} disabled={isSaving} style={styles.btnGold}>✓ Publish Now</button>
            <button onClick={reset} style={styles.btnGhost}>Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaBox({ label, children }) {
  return (
    <div style={{ background:'#f9f5ee', borderRadius:'0.5rem', padding:'0.875rem', border:'1px solid #e8dfc8' }}>
      <p style={{ margin:'0 0 0.4rem', fontSize:'0.7rem', fontWeight:'bold', color:'#8b7355', textTransform:'uppercase' }}>{label}</p>
      {children}
    </div>
  );
}

const styles = {
  card: {
    background:'#fff', border:'1px solid #e8dfc8',
    borderRadius:'1rem', padding:'2rem',
  },
  label: {
    display:'block', fontWeight:'bold', color:'#1e2d4a',
    marginBottom:'0.45rem', fontSize:'0.9rem',
  },
  select: {
    display:'block', width:'100%',
    padding:'0.65rem 0.9rem',
    border:'1px solid #d4c5a9', borderRadius:'0.5rem',
    fontSize:'1rem', fontFamily:'inherit',
    backgroundColor:'#ffffff', color:'#1e2d4a',
    cursor:'pointer', appearance:'auto',
    WebkitAppearance:'auto', MozAppearance:'auto',
    outline:'none', boxSizing:'border-box',
  },
  selectPlaceholder: {
    padding:'0.65rem 0.9rem', border:'1px solid #d4c5a9',
    borderRadius:'0.5rem', fontSize:'0.9rem', color:'#8b7355',
    background:'#f9f5ee', fontStyle:'italic',
  },
  input: {
    display:'block', width:'100%',
    padding:'0.65rem 0.9rem', border:'1px solid #d4c5a9',
    borderRadius:'0.5rem', fontSize:'1rem',
    fontFamily:'inherit', outline:'none', boxSizing:'border-box',
    color:'#1e2d4a', backgroundColor:'#fff',
  },
  inputSm: {
    display:'block', width:'100%',
    padding:'0.4rem 0.6rem', border:'1px solid #d4c5a9',
    borderRadius:'0.4rem', fontSize:'0.875rem',
    fontFamily:'inherit', outline:'none', boxSizing:'border-box',
    color:'#1e2d4a', backgroundColor:'#fff',
  },
  btn: {
    backgroundColor:'#1e2d4a', color:'white', border:'none',
    borderRadius:'0.5rem', padding:'0.7rem 1.5rem',
    fontSize:'0.95rem', fontWeight:'600', cursor:'pointer',
    fontFamily:'inherit',
  },
  btnGhost: {
    background:'transparent', color:'#6b6b6b',
    border:'1px solid #d4c5a9', borderRadius:'0.5rem',
    padding:'0.55rem 1rem', fontSize:'0.875rem',
    cursor:'pointer', fontFamily:'inherit',
  },
  btnGold: {
    backgroundColor:'#b8860b', color:'white', border:'none',
    borderRadius:'0.5rem', padding:'0.6rem 1.25rem',
    fontSize:'0.875rem', fontWeight:'600',
    cursor:'pointer', fontFamily:'inherit',
  },
  banner: (bg, border, color) => ({
    background:bg, border:`1px solid ${border}`, color,
    borderRadius:'0.5rem', padding:'0.75rem 1rem',
    marginBottom:'1rem', fontSize:'0.875rem',
  }),
  hr: { border:'none', borderTop:'1px solid #e8dfc8', margin:'0 0 1.5rem' },
  metaLabel: { margin:'0 0 0.5rem', fontSize:'0.7rem', fontWeight:'bold', color:'#8b7355', textTransform:'uppercase' },
  metaText: { margin:0, fontSize:'0.875rem', color:'#1e2d4a' },
  tag: {
    display:'inline-block', background:'#f5f0e8', color:'#8b7355',
    fontSize:'0.78rem', padding:'0.2rem 0.65rem', borderRadius:'1rem',
    border:'1px solid #e8dfc8', marginRight:'0.4rem', marginBottom:'0.4rem',
  },
};
