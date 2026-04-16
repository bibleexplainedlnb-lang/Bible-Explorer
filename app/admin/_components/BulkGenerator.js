'use client';

import { useState, useRef } from 'react';
import { CATEGORIES } from '../../../lib/categories.js';

const S = {
  card: { background: '#fff', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2rem' },
  label: { display: 'block', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.4rem', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn: (v = 'primary', disabled = false) => ({
    backgroundColor: v === 'primary' ? '#1e2d4a' : 'transparent',
    color: v === 'primary' ? 'white' : '#6b6b6b',
    border: v === 'primary' ? 'none' : '1px solid #d4c5a9',
    borderRadius: '0.5rem', padding: '0.7rem 1.75rem', fontSize: '0.95rem', fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    opacity: disabled ? 0.65 : 1,
  }),
  badge: (s) => ({
    display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600',
    background: s === 'saved' ? '#dcf5e7' : s === 'skipped' ? '#fff3cd' : '#fff0f0',
    color:      s === 'saved' ? '#1b5e20' : s === 'skipped' ? '#856404' : '#7b2020',
  }),
};

export default function BulkGenerator({ onSaved }) {
  const [category, setCategory] = useState('questions');
  const [count,    setCount]    = useState(5);
  const [status,   setStatus]   = useState('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, topic: '' });
  const [log,      setLog]      = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [error,    setError]    = useState('');
  const abortRef = useRef(null);

  function reset() {
    setStatus('idle'); setLog([]); setSummary(null); setError(''); setProgress({ current: 0, total: 0, topic: '' });
  }

  async function handleBulk(e) {
    e.preventDefault();
    reset();
    setStatus('generating');

    try {
      const res = await fetch('/api/admin/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, count }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setError(err.error ?? 'Bulk generation failed.');
        setStatus('idle');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      abortRef.current = reader;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const chunk of lines) {
          const line = chunk.replace(/^data: /, '').trim();
          if (!line) continue;
          let event;
          try { event = JSON.parse(line); } catch { continue; }

          if (event.type === 'progress') {
            setProgress({ current: event.current, total: event.total, topic: event.topic });
          } else if (event.type === 'saved') {
            setLog(prev => [...prev, { kind: 'saved', title: event.title, slug: event.slug, n: event.current, total: event.total }]);
          } else if (event.type === 'skipped') {
            setLog(prev => [...prev, { kind: 'skipped', title: event.topic, reason: event.reason, n: event.current, total: event.total }]);
          } else if (event.type === 'done') {
            setSummary({ generated: event.generated, skipped: event.skipped });
            setStatus('done');
            onSaved?.();
          } else if (event.type === 'error') {
            setError(event.message);
            setStatus('idle');
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setStatus('idle');
      }
    }
  }

  const isGenerating = status === 'generating';

  return (
    <div>
      <div style={S.card}>
        <p style={{ margin: '0 0 1.5rem', color: '#6b6b6b', fontSize: '0.9rem' }}>
          Pick a category, choose how many articles to generate, and let the system do the rest.
          Articles are saved as drafts — review and publish them from the Dashboard tab.
        </p>

        <form onSubmit={handleBulk}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={S.label}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={S.input} disabled={isGenerating}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Number of articles (1–20)</label>
              <input
                type="number" value={count}
                onChange={e => setCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                min={1} max={20} style={S.input} disabled={isGenerating}
              />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button type="submit" disabled={isGenerating} style={S.btn('primary', isGenerating)}>
              {isGenerating
                ? `Generating ${progress.current} of ${progress.total || count}…`
                : `✦ Generate ${count} Article${count !== 1 ? 's' : ''}`}
            </button>
            {status === 'done' && (
              <button type="button" onClick={reset} style={S.btn('ghost')}>Generate more</button>
            )}
          </div>
        </form>
      </div>

      {isGenerating && (
        <div style={{ ...S.card, marginTop: '1.5rem', textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>✦</div>
          <p style={{ margin: '0 0 0.3rem', fontWeight: '600', color: '#1e2d4a', fontSize: '1rem' }}>
            Generating {progress.current} of {progress.total || count}…
          </p>
          {progress.topic && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#8b7355' }}>
              Current topic: <em>{progress.topic}</em>
            </p>
          )}
          <div style={{ marginTop: '1rem', background: '#f0ece4', borderRadius: '0.5rem', height: '6px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#1e2d4a', borderRadius: '0.5rem',
              width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {summary && (
        <div style={{ ...S.card, marginTop: '1.5rem', background: '#f3fbf6', border: '1px solid #b7dfc8' }}>
          <p style={{ margin: '0 0 0.25rem', fontWeight: '700', color: '#1b5e20', fontSize: '1rem' }}>
            ✓ {summary.generated + summary.skipped} processed ({summary.generated} saved, {summary.skipped} skipped)
          </p>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#4a7c59' }}>
            All saved as drafts. Go to the Dashboard tab to review and publish them.
          </p>
        </div>
      )}

      {log.length > 0 && (
        <div style={{ ...S.card, marginTop: '1rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: '700', color: '#1e2d4a', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Activity Log
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {log.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: '#f9f5ee', borderRadius: '0.4rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.78rem', color: '#aaa', marginRight: '0.5rem' }}>{item.n}/{item.total}</span>
                  <span style={{ fontWeight: '600', color: '#1e2d4a', fontSize: '0.875rem', wordBreak: 'break-word' }}>{item.title}</span>
                  {item.kind === 'saved' && item.slug && (
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#8b7355', fontFamily: 'monospace', marginTop: '0.1rem' }}>{item.slug}</span>
                  )}
                  {item.kind === 'skipped' && item.reason && (
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#856404', marginTop: '0.1rem' }}>{item.reason}</span>
                  )}
                </div>
                <span style={S.badge(item.kind)}>{item.kind === 'saved' ? 'Saved' : 'Skipped'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
