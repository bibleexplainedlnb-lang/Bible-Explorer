'use client';

import { useState, useEffect } from 'react';

const S = {
  card:  { background:'#fff', border:'1px solid #e8dfc8', borderRadius:'1rem', padding:'2rem' },
  label: { display:'block', fontWeight:'bold', color:'#1e2d4a', marginBottom:'0.4rem', fontSize:'0.9rem' },
  input: { width:'100%', padding:'0.65rem 0.9rem', border:'1px solid #d4c5a9', borderRadius:'0.5rem', fontSize:'1rem', fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
  btn:   { backgroundColor:'#1e2d4a', color:'white', border:'none', borderRadius:'0.5rem', padding:'0.65rem 1.5rem', fontSize:'0.95rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' },
  catBadge: { display:'inline-block', padding:'0.15rem 0.6rem', borderRadius:'1rem', fontSize:'0.72rem', fontWeight:'600',
    background:'#f5f0e8', color:'#8b7355', border:'1px solid #e8dfc8' },
};

const CATEGORIES = ['questions', 'guides', 'topics'];

export default function Topics() {
  const [topics,  setTopics]  = useState([]);
  const [name,    setName]    = useState('');
  const [cat,     setCat]     = useState('questions');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  async function load() {
    const res = await fetch('/api/admin/topics/');
    const d   = await res.json();
    if (Array.isArray(d)) setTopics(d);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Topic name is required.'); return; }
    setError(''); setSaving(true);
    try {
      const res = await fetch('/api/admin/topics/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category: cat }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to add topic.'); setSaving(false); return; }
      setName('');
      setSuccess(`Topic "${data.name}" added!`);
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  const grouped = topics.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'1.5rem', alignItems:'start' }}>
      {/* Add form */}
      <div style={S.card}>
        <h3 style={{ fontFamily:'Georgia,serif', margin:'0 0 1.5rem', color:'#1e2d4a', fontSize:'1.1rem' }}>Add New Topic</h3>
        <form onSubmit={handleAdd}>
          <div style={{ marginBottom:'1rem' }}>
            <label style={S.label}>Topic Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Trust, Hope, Worship" style={S.input} />
          </div>
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={S.label}>Category</label>
            <select value={cat} onChange={e => setCat(e.target.value)} style={S.input}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          {error && <div style={{ background:'#fff0f0', border:'1px solid #f5c6c6', color:'#7b2020', borderRadius:'0.5rem', padding:'0.65rem 0.9rem', marginBottom:'1rem', fontSize:'0.875rem' }}>{error}</div>}
          {success && <div style={{ background:'#f0fff4', border:'1px solid #b2dfdb', color:'#1b5e20', borderRadius:'0.5rem', padding:'0.65rem 0.9rem', marginBottom:'1rem', fontSize:'0.875rem' }}>{success}</div>}
          <button type="submit" disabled={saving} style={{ ...S.btn, opacity: saving ? 0.7 : 1, width:'100%' }}>
            {saving ? 'Adding…' : '+ Add Topic'}
          </button>
        </form>
      </div>

      {/* Topics list */}
      <div>
        {CATEGORIES.map(category => {
          const list = grouped[category] || [];
          return (
            <div key={category} style={{ ...S.card, marginBottom:'1rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
                <h3 style={{ margin:0, fontFamily:'Georgia,serif', color:'#1e2d4a', fontSize:'1rem' }}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <span style={{ ...S.catBadge }}>{list.length}</span>
              </div>
              {list.length === 0 ? (
                <p style={{ margin:0, color:'#aaa', fontSize:'0.875rem' }}>No topics yet — add one!</p>
              ) : (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                  {list.map(t => (
                    <span key={t.id} style={{ background:'#f5f0e8', color:'#1e2d4a', fontSize:'0.875rem', padding:'0.35rem 0.85rem', borderRadius:'2rem', border:'1px solid #e8dfc8' }}>
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
