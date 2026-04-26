'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { CATEGORIES } from '../../../lib/categories.js';

const S = {
  card:  { background: '#fff', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2rem' },
  label: { display: 'block', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.4rem', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#000' },
  btn:   (v = 'primary', disabled = false) => ({
    backgroundColor: v === 'primary' ? '#1e2d4a' : v === 'ghost' ? 'transparent' : '#f5f0e8',
    color:           v === 'primary' ? 'white'   : '#5a4a35',
    border:          v === 'primary' ? 'none'    : '1px solid #d4c5a9',
    borderRadius: '0.5rem', padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: disabled ? 0.65 : 1,
  }),
  badge: (s) => ({
    display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600',
    background: s === 'saved'   ? '#dcf5e7' : s === 'skipped' ? '#fff3cd' : s === 'pending' ? '#eef2ff' : '#f5f0e8',
    color:      s === 'saved'   ? '#1b5e20' : s === 'skipped' ? '#856404' : s === 'pending' ? '#3730a3' : '#8b7355',
  }),
  radio: { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.6rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #e8dfc8', background: '#f9f5ee', marginBottom: '0.4rem' },
};

function toSlug(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

const SCOPES = [
  { value: 'parent',   label: 'Parent topic only',      desc: 'Generate one article for the selected parent topic.' },
  { value: 'child',    label: 'Selected child only',     desc: 'Generate one article for the selected child topic.' },
  { value: 'children', label: 'All children of parent',  desc: 'Generate one article per child topic (up to the limit).' },
];

export default function BulkGenerator({ onSaved }) {
  const [category,      setCategory]      = useState('questions');
  const [hierarchy,     setHierarchy]     = useState([]);
  const [loadingH,      setLoadingH]      = useState(false);
  const [parentId,      setParentId]      = useState('');
  const [childId,       setChildId]       = useState('');
  const [scope,         setScope]         = useState('children');
  const [limit,         setLimit]         = useState(10);
  const [phase,         setPhase]         = useState('config');
  const [status,        setStatus]        = useState('idle');
  const [progress,      setProgress]      = useState({ current: 0, total: 0, topic: '' });
  const [log,           setLog]           = useState([]);
  const [summary,       setSummary]       = useState(null);
  const [error,         setError]         = useState('');
  const abortRef = useRef(null);

  async function loadHierarchy(cat) {
    setLoadingH(true);
    setHierarchy([]);
    setParentId('');
    setChildId('');
    try {
      const res = await fetch(`/api/topics/hierarchy?category=${cat}`);
      const d   = await res.json();
      if (Array.isArray(d)) setHierarchy(d);
    } catch (err) {
      console.error('[BulkGenerator] hierarchy load error:', err);
    }
    setLoadingH(false);
  }

  useEffect(() => { loadHierarchy(category); }, [category]);

  const selectedParent  = useMemo(() => hierarchy.find(n => n.id === parentId) || null, [hierarchy, parentId]);
  const childOptions    = useMemo(() => selectedParent?.children || [], [selectedParent]);
  const selectedChild   = useMemo(() => childOptions.find(c => c.id === childId) || null, [childOptions, childId]);

  const previewTopics = useMemo(() => {
    if (scope === 'parent'   && selectedParent) return [selectedParent];
    if (scope === 'child'    && selectedChild)  return [selectedChild];
    if (scope === 'children' && selectedParent) return childOptions.slice(0, limit);
    return [];
  }, [scope, selectedParent, selectedChild, childOptions, limit]);

  const canPreview = previewTopics.length > 0;

  function resetGeneration() {
    setStatus('idle');
    setLog([]);
    setSummary(null);
    setError('');
    setProgress({ current: 0, total: 0, topic: '' });
  }

  function backToConfig() {
    resetGeneration();
    setPhase('config');
  }

  async function handleGenerate() {
    resetGeneration();
    setPhase('generating');
    setStatus('generating');

    const topicIds = previewTopics.map(t => t.id);

    try {
      const res = await fetch('/api/admin/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicIds, category, limit }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setError(err.error ?? 'Bulk generation failed.');
        setStatus('idle');
        return;
      }

      const reader  = res.body.getReader();
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

          if (event.type === 'start') {
            setProgress({ current: 0, total: event.total, topic: '' });
          } else if (event.type === 'progress') {
            setProgress({ current: event.current, total: event.total, topic: event.topic });
          } else if (event.type === 'saved') {
            setLog(prev => [...prev, { kind: 'saved',   title: event.title, slug: event.slug, n: event.current, total: event.total }]);
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
      {/* ── PHASE 1: CONFIG ── */}
      {phase === 'config' && (
        <div style={S.card}>
          <p style={{ margin: '0 0 1.75rem', color: '#6b6b6b', fontSize: '0.9rem' }}>
            Choose exactly which topics to generate for. Review the topic list before anything is sent to AI.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={S.label}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={S.input}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Max articles to generate</label>
              <input
                type="number" value={limit}
                onChange={e => setLimit(Math.min(50, Math.max(1, Number(e.target.value))))}
                min={1} max={50} style={S.input}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={S.label}>Parent Topic {loadingH && <span style={{ fontWeight: 400, color: '#aaa', fontSize: '0.78rem' }}>(loading…)</span>}</label>
              <select
                value={parentId}
                onChange={e => { setParentId(e.target.value); setChildId(''); }}
                style={S.input}
                disabled={loadingH}
              >
                <option value="">— Select parent topic —</option>
                {hierarchy.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.name}{n.children.length ? ` (${n.children.length} children)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>Child Topic</label>
              <select
                value={childId}
                onChange={e => setChildId(e.target.value)}
                style={S.input}
                disabled={!childOptions.length}
              >
                <option value="">— {childOptions.length ? 'Select child topic' : 'No children available'} —</option>
                {childOptions.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.article_created ? ' ✔' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={S.label}>Generate for</label>
            {SCOPES.map(s => {
              const disabled =
                (s.value === 'parent'   && !selectedParent) ||
                (s.value === 'child'    && !selectedChild)  ||
                (s.value === 'children' && !childOptions.length);
              return (
                <label
                  key={s.value}
                  style={{ ...S.radio, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer', background: scope === s.value ? '#f0f4ff' : '#f9f5ee', borderColor: scope === s.value ? '#3730a3' : '#e8dfc8' }}
                >
                  <input
                    type="radio" name="scope" value={s.value}
                    checked={scope === s.value}
                    onChange={() => !disabled && setScope(s.value)}
                    disabled={disabled}
                    style={{ accentColor: '#1e2d4a' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e2d4a', fontSize: '0.9rem' }}>{s.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#8b7355' }}>{s.desc}</div>
                  </div>
                </label>
              );
            })}
          </div>

          <button
            onClick={() => setPhase('preview')}
            disabled={!canPreview}
            style={S.btn('primary', !canPreview)}
          >
            Preview {previewTopics.length} Topic{previewTopics.length !== 1 ? 's' : ''} →
          </button>

          {!canPreview && parentId && (
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.82rem', color: '#8b7355' }}>
              {scope === 'child' ? 'Select a child topic first.' : scope === 'children' && !childOptions.length ? 'This parent has no child topics.' : 'Select a parent topic first.'}
            </p>
          )}
        </div>
      )}

      {/* ── PHASE 2: PREVIEW ── */}
      {phase === 'preview' && (
        <div>
          <div style={{ ...S.card, marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontFamily: 'Georgia,serif', color: '#1e2d4a', margin: '0 0 0.25rem', fontSize: '1.05rem' }}>
                  Ready to generate {previewTopics.length} article{previewTopics.length !== 1 ? 's' : ''}
                </h3>
                <p style={{ margin: 0, color: '#8b7355', fontSize: '0.875rem' }}>
                  Scope: <strong>{SCOPES.find(s => s.value === scope)?.label}</strong>
                  {selectedParent && <> · Parent: <strong>{selectedParent.name}</strong></>}
                  {selectedChild  && scope === 'child' && <> · Child: <strong>{selectedChild.name}</strong></>}
                </p>
              </div>
              <button onClick={backToConfig} style={S.btn('ghost')}>← Edit</button>
            </div>

            <div style={{ border: '1px solid #e8dfc8', borderRadius: '0.75rem', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', padding: '0.5rem 1rem', background: '#f5f0e8', fontSize: '0.78rem', fontWeight: '700', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Topic</span>
                <span>Status</span>
              </div>
              {previewTopics.map((t, i) => (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'center', padding: '0.75rem 1rem', borderTop: i > 0 ? '1px solid #f0ebe0' : 'none', background: '#fff' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e2d4a', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{t.name}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#8b7355' }}>
                      slug preview: {toSlug(t.name)}
                    </div>
                  </div>
                  <span style={S.badge(t.article_created ? 'done' : 'pending')}>
                    {t.article_created ? 'Has article' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            {previewTopics.some(t => t.article_created) && (
              <p style={{ margin: '0.875rem 0 0', fontSize: '0.82rem', color: '#856404', background: '#fff3cd', border: '1px solid #ffc107', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
                Topics marked "Has article" will be skipped (already have a published article).
              </p>
            )}
          </div>

          <button onClick={handleGenerate} style={S.btn('primary')}>
            ✦ Generate {previewTopics.length} Article{previewTopics.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* ── PHASE 3: GENERATING ── */}
      {phase === 'generating' && (
        <div>
          {isGenerating && (
            <div style={{ ...S.card, textAlign: 'center', padding: '2.5rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>✦</div>
              <p style={{ margin: '0 0 0.3rem', fontWeight: '600', color: '#1e2d4a', fontSize: '1rem' }}>
                {progress.current} of {progress.total || previewTopics.length} generated…
              </p>
              {progress.topic && (
                <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#8b7355' }}>
                  Current topic: <em>{progress.topic}</em>
                </p>
              )}
              <div style={{ background: '#f0ece4', borderRadius: '0.5rem', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: '#1e2d4a', borderRadius: '0.5rem',
                  width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          {summary && (
            <div style={{ ...S.card, marginBottom: '1.25rem', background: '#f3fbf6', border: '1px solid #b7dfc8' }}>
              <p style={{ margin: '0 0 0.25rem', fontWeight: '700', color: '#1b5e20', fontSize: '1rem' }}>
                ✓ Done — {summary.generated} saved, {summary.skipped} skipped
              </p>
              <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: '#4a7c59' }}>
                All saved as drafts. Go to the Dashboard tab to review and publish.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={backToConfig} style={S.btn('secondary')}>← New batch</button>
              </div>
            </div>
          )}

          {log.length > 0 && (
            <div style={S.card}>
              <p style={{ margin: '0 0 1rem', fontWeight: '700', color: '#1e2d4a', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Activity Log
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {log.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.6rem 0.75rem', background: '#f9f5ee', borderRadius: '0.4rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.78rem', color: '#aaa', marginRight: '0.5rem' }}>{item.n}/{item.total}</span>
                      <span style={{ fontWeight: '600', color: '#1e2d4a', fontSize: '0.875rem', wordBreak: 'break-word' }}>{item.title}</span>
                      {item.kind === 'saved'   && item.slug   && <span style={{ display: 'block', fontSize: '0.75rem', color: '#8b7355', fontFamily: 'monospace', marginTop: '0.1rem' }}>{item.slug}</span>}
                      {item.kind === 'skipped' && item.reason && <span style={{ display: 'block', fontSize: '0.75rem', color: '#856404', marginTop: '0.1rem' }}>{item.reason}</span>}
                    </div>
                    <span style={S.badge(item.kind)}>{item.kind === 'saved' ? 'Saved' : 'Skipped'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
