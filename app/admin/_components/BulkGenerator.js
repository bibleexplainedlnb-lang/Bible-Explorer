'use client';

import { useState } from 'react';

const S = {
  card: { background:'#fff', border:'1px solid #e8dfc8', borderRadius:'1rem', padding:'2rem' },
  label: { display:'block', fontWeight:'bold', color:'#1e2d4a', marginBottom:'0.4rem', fontSize:'0.9rem' },
  input: { width:'100%', padding:'0.65rem 0.9rem', border:'1px solid #d4c5a9', borderRadius:'0.5rem', fontSize:'1rem', fontFamily:'inherit', outline:'none', boxSizing:'border-box' },
  btn: (v='primary') => ({
    backgroundColor: v==='primary' ? '#1e2d4a' : 'transparent',
    color: v==='primary' ? 'white' : '#6b6b6b',
    border: v==='primary' ? 'none' : '1px solid #d4c5a9',
    borderRadius:'0.5rem', padding:'0.7rem 1.75rem', fontSize:'0.95rem', fontWeight:'600', cursor:'pointer', fontFamily:'inherit',
  }),
  badge: (s) => ({ display:'inline-block', padding:'0.2rem 0.65rem', borderRadius:'1rem', fontSize:'0.75rem', fontWeight:'600',
    background: s==='published' ? '#dcf5e7' : s==='error' ? '#fff0f0' : '#fff3cd',
    color: s==='published' ? '#1b5e20' : s==='error' ? '#7b2020' : '#856404' }),
};

export default function BulkGenerator({ onSaved }) {
  const [category, setCategory] = useState('questions');
  const [count,    setCount]    = useState(3);
  const [status,   setStatus]   = useState('idle');
  const [results,  setResults]  = useState(null);
  const [error,    setError]    = useState('');

  async function handleBulk(e) {
    e.preventDefault();
    setError(''); setResults(null); setStatus('generating');
    try {
      const res = await fetch('/api/admin/bulk/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, count }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Bulk generation failed.'); setStatus('idle'); return; }
      setResults(data);
      setStatus('done');
      onSaved?.();
    } catch (err) {
      setError(err.message); setStatus('idle');
    }
  }

  return (
    <div>
      <div style={S.card}>
        <p style={{ margin:'0 0 1.5rem', color:'#6b6b6b', fontSize:'0.9rem' }}>
          Automatically pick topics from a category, generate articles, and save them all as drafts. You can then review and publish from the Dashboard tab.
        </p>

        <form onSubmit={handleBulk}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
            <div>
              <label style={S.label}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={S.input}>
                <option value="questions">Questions</option>
                <option value="guides">Guides</option>
                <option value="topics">Topics</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Number of articles (max 10)</label>
              <input type="number" value={count} onChange={e => setCount(Number(e.target.value))}
                min={1} max={10} style={S.input} />
            </div>
          </div>

          {error && (
            <div style={{ background:'#fff0f0', border:'1px solid #f5c6c6', color:'#7b2020', borderRadius:'0.5rem', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.875rem' }}>
              {error}
            </div>
          )}

          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button type="submit" disabled={status === 'generating'} style={{ ...S.btn('primary'), opacity: status === 'generating' ? 0.7 : 1 }}>
              {status === 'generating' ? `⟳ Generating ${count} articles…` : `✦ Generate ${count} Articles`}
            </button>
            {status === 'done' && (
              <button type="button" onClick={() => { setStatus('idle'); setResults(null); }} style={S.btn('ghost')}>
                Generate more
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Generating indicator */}
      {status === 'generating' && (
        <div style={{ textAlign:'center', padding:'3rem', ...S.card, marginTop:'1.5rem' }}>
          <div style={{ fontSize:'1.75rem', marginBottom:'0.75rem' }}>✦</div>
          <p style={{ margin:'0 0 0.5rem', color:'#8b7355' }}>Generating {count} articles — this may take 30–60 seconds…</p>
          <p style={{ margin:0, fontSize:'0.85rem', color:'#aaa' }}>Each article is generated and saved automatically.</p>
        </div>
      )}

      {/* Results */}
      {status === 'done' && results && (
        <div style={{ ...S.card, marginTop:'1.5rem' }}>
          <div style={{ marginBottom:'1rem' }}>
            <span style={{ fontSize:'0.72rem', fontWeight:'bold', color:'#2d6a4f', textTransform:'uppercase' }}>
              ✓ {results.total} articles saved as drafts
            </span>
            {results.errors?.length > 0 && (
              <span style={{ marginLeft:'1rem', fontSize:'0.72rem', fontWeight:'bold', color:'#7b2020', textTransform:'uppercase' }}>
                {results.errors.length} failed
              </span>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {results.saved.map(a => (
              <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem', background:'#f9f5ee', borderRadius:'0.5rem', flexWrap:'wrap', gap:'0.5rem' }}>
                <div>
                  <p style={{ margin:'0 0 0.2rem', fontWeight:'600', color:'#1e2d4a', fontSize:'0.9rem' }}>{a.title}</p>
                  <p style={{ margin:0, fontSize:'0.78rem', color:'#8b7355', fontFamily:'monospace' }}>{a.slug}</p>
                </div>
                <span style={S.badge('draft')}>Draft</span>
              </div>
            ))}
            {results.errors?.map((e, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem', background:'#fff0f0', borderRadius:'0.5rem', flexWrap:'wrap', gap:'0.5rem' }}>
                <div>
                  <p style={{ margin:'0 0 0.2rem', fontWeight:'600', color:'#7b2020', fontSize:'0.9rem' }}>{e.topic}</p>
                  <p style={{ margin:0, fontSize:'0.78rem', color:'#7b2020' }}>{e.error}</p>
                </div>
                <span style={S.badge('error')}>Failed</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
