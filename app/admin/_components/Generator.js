'use client';

import { useState, useEffect } from 'react';

const S = {
  card:  { background:'#fff', border:'1px solid #e8dfc8', borderRadius:'1rem', padding:'2rem', marginBottom:'1.5rem' },
  label: { display:'block', fontWeight:'bold', color:'#1e2d4a', marginBottom:'0.4rem', fontSize:'0.9rem' },
  input: { width:'100%', padding:'0.65rem 0.9rem', border:'1px solid #d4c5a9', borderRadius:'0.5rem', fontSize:'1rem', fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
  btn:   (variant='primary') => ({
    backgroundColor: variant==='primary' ? '#1e2d4a' : variant==='gold' ? '#b8860b' : 'transparent',
    color: variant==='ghost' ? '#6b6b6b' : 'white',
    border: variant==='ghost' ? '1px solid #d4c5a9' : 'none',
    borderRadius:'0.5rem', padding:'0.7rem 1.5rem', fontSize:'0.95rem', fontWeight:'600',
    cursor:'pointer', fontFamily:'inherit',
  }),
  metaBox: { background:'#f9f5ee', borderRadius:'0.5rem', padding:'0.875rem', border:'1px solid #e8dfc8' },
  tag:     { display:'inline-block', background:'#f5f0e8', color:'#8b7355', fontSize:'0.78rem', padding:'0.2rem 0.65rem', borderRadius:'1rem', border:'1px solid #e8dfc8', marginRight:'0.4rem', marginBottom:'0.4rem' },
};

export default function Generator({ onSaved }) {
  const [topics,   setTopics]   = useState([]);
  const [topicId,  setTopicId]  = useState('');
  const [idea,     setIdea]     = useState('');
  const [status,   setStatus]   = useState('idle');
  const [preview,  setPreview]  = useState(null);
  const [editing,  setEditing]  = useState(false);
  const [editData, setEditData] = useState({});
  const [error,    setError]    = useState('');

  useEffect(() => {
    fetch('/api/admin/topics/')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTopics(d); })
      .catch(() => {});
  }, []);

  const grouped = topics.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  const selectedTopic = topics.find(t => t.id === topicId);

  async function handleGenerate(e) {
    e?.preventDefault();
    if (!topicId) { setError('Please select a topic.'); return; }
    setError(''); setPreview(null); setEditing(false); setStatus('generating');
    try {
      const res = await fetch('/api/admin/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, topicName: selectedTopic?.name, idea: idea.trim(), category: selectedTopic?.category }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Generation failed.'); setStatus('idle'); return; }
      setPreview(data);
      setEditData({ title: data.title, meta_title: data.meta_title, meta_description: data.meta_description, content: data.content });
      setStatus('preview');
    } catch (err) {
      setError(err.message); setStatus('idle');
    }
  }

  async function handleSave(publish = false) {
    if (!preview) return;
    setStatus('saving');
    const payload = {
      ...preview,
      ...(editing ? editData : {}),
      status: publish ? 'published' : 'draft',
    };
    try {
      const res = await fetch('/api/admin/articles/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Save failed.'); setStatus('preview'); return; }
      setStatus('saved');
      setPreview(data);
      onSaved?.();
    } catch (err) {
      setError(err.message); setStatus('preview');
    }
  }

  function reset() { setStatus('idle'); setPreview(null); setEditing(false); setError(''); setIdea(''); }

  const displayTitle   = editing ? editData.title            : preview?.title;
  const displayMeta    = editing ? editData.meta_title       : preview?.meta_title;
  const displayDesc    = editing ? editData.meta_description : preview?.meta_description;
  const displayContent = editing ? editData.content          : preview?.content;

  return (
    <div>
      {/* Success */}
      {status === 'saved' && preview && (
        <div style={{ background:'#f0fff4', border:'1px solid #b2dfdb', borderRadius:'0.75rem', padding:'1.5rem', marginBottom:'1.5rem' }}>
          <p style={{ margin:'0 0 0.5rem', fontWeight:'bold', color:'#1b5e20' }}>Article saved successfully!</p>
          <p style={{ margin:'0 0 1rem', color:'#2d6a4f', fontSize:'0.9rem' }}>
            <em>{preview.title}</em> — Status: <strong>{preview.status}</strong>
          </p>
          <button onClick={reset} style={S.btn('primary')}>Generate another</button>
        </div>
      )}

      {/* Form */}
      {status !== 'saved' && (
        <div style={S.card}>
          <form onSubmit={handleGenerate}>
            {/* Topic selector */}
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={S.label}>Topic</label>
              <select value={topicId} onChange={e => setTopicId(e.target.value)} style={S.input}>
                <option value="">— Select a topic —</option>
                {Object.entries(grouped).map(([cat, list]) => (
                  <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                    {list.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Content idea */}
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={S.label}>
                Content Idea <span style={{ fontWeight:400, color:'#8b7355' }}>(optional)</span>
              </label>
              <input type="text" value={idea} onChange={e => setIdea(e.target.value)}
                placeholder="e.g. how to forgive someone who hurt you, overcoming doubt"
                style={S.input} />
              <p style={{ margin:'0.3rem 0 0', fontSize:'0.8rem', color:'#8b7355' }}>
                A keyword or angle to guide the article. Leave blank to let AI decide.
              </p>
            </div>

            {error && (
              <div style={{ background:'#fff0f0', border:'1px solid #f5c6c6', color:'#7b2020', borderRadius:'0.5rem', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.875rem' }}>
                {error}
              </div>
            )}

            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              <button type="submit" disabled={status === 'generating'} style={{ ...S.btn('primary'), opacity: status === 'generating' ? 0.7 : 1 }}>
                {status === 'generating' ? '⟳ Generating…' : '✦ Generate Article'}
              </button>
              {status === 'preview' && <button type="button" onClick={reset} style={S.btn('ghost')}>Start over</button>}
            </div>
          </form>
        </div>
      )}

      {/* Generating spinner */}
      {status === 'generating' && (
        <div style={{ textAlign:'center', padding:'3rem', ...S.card }}>
          <div style={{ fontSize:'1.75rem', marginBottom:'0.75rem' }}>✦</div>
          <p style={{ margin:0, color:'#8b7355' }}>Writing article — usually takes 15–20 seconds…</p>
        </div>
      )}

      {/* Preview */}
      {(status === 'preview' || status === 'saving') && preview && (
        <div style={S.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
            <div>
              <span style={{ fontSize:'0.72rem', fontWeight:'bold', color:'#b8860b', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                Preview — not yet saved
              </span>
              {editing ? (
                <input value={editData.title} onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                  style={{ ...S.input, marginTop:'0.3rem', fontSize:'1.1rem', fontWeight:'bold', color:'#1e2d4a' }} />
              ) : (
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:'1.4rem', color:'#1e2d4a', margin:'0.3rem 0 0' }}>{displayTitle}</h2>
              )}
            </div>
            <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap' }}>
              <button onClick={() => handleSave(false)} disabled={status === 'saving'} style={S.btn('ghost')}>
                {status === 'saving' ? 'Saving…' : '📄 Save Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={status === 'saving'} style={S.btn('gold')}>
                {status === 'saving' ? 'Saving…' : '✓ Publish'}
              </button>
              <button onClick={() => setEditing(e => !e)} style={S.btn('ghost')}>
                {editing ? 'View' : '✎ Edit'}
              </button>
              <button onClick={handleGenerate} style={S.btn('ghost')}>↻ Regen</button>
            </div>
          </div>

          <hr style={{ border:'none', borderTop:'1px solid #e8dfc8', margin:'0 0 1.5rem' }} />

          {/* SEO fields */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.875rem', marginBottom:'1.25rem' }}>
            <div style={S.metaBox}>
              <p style={{ margin:'0 0 0.3rem', fontSize:'0.7rem', fontWeight:'bold', color:'#8b7355', textTransform:'uppercase' }}>Meta Title ({displayMeta?.length || 0} chars)</p>
              {editing
                ? <input value={editData.meta_title} onChange={e => setEditData(d => ({ ...d, meta_title: e.target.value }))} style={{ ...S.input, fontSize:'0.875rem', padding:'0.4rem 0.6rem' }} />
                : <p style={{ margin:0, fontSize:'0.875rem', color:'#1e2d4a' }}>{displayMeta}</p>}
            </div>
            <div style={S.metaBox}>
              <p style={{ margin:'0 0 0.3rem', fontSize:'0.7rem', fontWeight:'bold', color:'#8b7355', textTransform:'uppercase' }}>Meta Description ({displayDesc?.length || 0} chars)</p>
              {editing
                ? <textarea value={editData.meta_description} onChange={e => setEditData(d => ({ ...d, meta_description: e.target.value }))} rows={3} style={{ ...S.input, fontSize:'0.875rem', padding:'0.4rem 0.6rem', resize:'vertical' }} />
                : <p style={{ margin:0, fontSize:'0.875rem', color:'#1e2d4a' }}>{displayDesc}</p>}
            </div>
          </div>

          {/* Keywords */}
          <div style={{ marginBottom:'1.25rem' }}>
            <p style={{ margin:'0 0 0.5rem', fontSize:'0.7rem', fontWeight:'bold', color:'#8b7355', textTransform:'uppercase' }}>Keywords</p>
            <div>{(preview.keywords ?? []).map(k => <span key={k} style={S.tag}>{k}</span>)}</div>
          </div>

          <hr style={{ border:'none', borderTop:'1px solid #e8dfc8', margin:'0 0 1.5rem' }} />

          <p style={{ margin:'0 0 0.75rem', fontSize:'0.7rem', fontWeight:'bold', color:'#8b7355', textTransform:'uppercase' }}>Article Content</p>
          {editing ? (
            <textarea value={editData.content} onChange={e => setEditData(d => ({ ...d, content: e.target.value }))}
              rows={20} style={{ ...S.input, fontSize:'0.875rem', resize:'vertical', lineHeight:1.7 }} />
          ) : (
            <div style={{ lineHeight:1.8, color:'#2a2a2a', fontSize:'0.95rem' }} dangerouslySetInnerHTML={{ __html: displayContent }} />
          )}

          {error && (
            <div style={{ background:'#fff0f0', border:'1px solid #f5c6c6', color:'#7b2020', borderRadius:'0.5rem', padding:'0.75rem 1rem', marginTop:'1rem', fontSize:'0.875rem' }}>
              {error}
            </div>
          )}

          <hr style={{ border:'none', borderTop:'1px solid #e8dfc8', margin:'1.5rem 0' }} />
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button onClick={() => handleSave(false)} disabled={status === 'saving'} style={S.btn('ghost')}>📄 Save as Draft</button>
            <button onClick={() => handleSave(true)} disabled={status === 'saving'} style={S.btn('gold')}>✓ Publish Now</button>
            <button onClick={reset} style={S.btn('ghost')}>Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}
