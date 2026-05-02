'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { friendlyDuplicateCopy } from '../../../lib/duplicateCopy';

const CATEGORIES = [
  { value: 'questions',        label: 'Questions' },
  { value: 'topics',           label: 'Topics' },
  { value: 'guides',           label: 'Guides' },
  { value: 'bible-verses',     label: 'Bible Verses' },
  { value: 'bible-characters', label: 'Bible Characters' },
];

const S = {
  card:  { background: '#fff', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2rem' },
  label: { display: 'block', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.4rem', fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#000' },
  btn:   (variant = 'primary', disabled = false) => ({
    backgroundColor: variant === 'primary' ? '#1e2d4a' : '#f5f0e8',
    color:           variant === 'primary' ? 'white'   : '#5a4a35',
    border:          variant === 'primary' ? 'none'    : '1px solid #d4c5a9',
    borderRadius: '0.5rem', padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: disabled ? 0.65 : 1,
  }),
  badge: (s) => ({
    display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600',
    background: s === 'saved'   ? '#dcf5e7' : s === 'skipped' ? '#fff3cd' : '#f5f0e8',
    color:      s === 'saved'   ? '#1b5e20' : s === 'skipped' ? '#856404' : '#8b7355',
  }),
};

const CATEGORY_LABELS = {
  questions: 'Questions', guides: 'Guides', topics: 'Topics',
  'bible-verses': 'Bible Verses', 'bible-characters': 'Bible Characters',
};
const LANGUAGE_LABELS = { en: 'English', de: 'German', es: 'Spanish', fr: 'French', pt: 'Portuguese', it: 'Italian' };
const categoryLabel = c => CATEGORY_LABELS[c] || c || 'Article';
const languageLabel = l => (l ? (LANGUAGE_LABELS[l.toLowerCase()] || l.toUpperCase()) : '');

export default function BulkGenerator({ onSaved }) {
  const [category,  setCategory]  = useState('questions');
  const [count,     setCount]     = useState(5);
  const [status,    setStatus]    = useState('idle'); // idle | generating | done
  const [progress,  setProgress]  = useState({ current: 0, total: 0, topic: '' });
  const [log,       setLog]       = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [error,     setError]     = useState('');
  const [counts,        setCounts]        = useState(null); // { categories: { ... }, uncategorized, totals }
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError,   setCountsError]   = useState(false);
  const readerRef = useRef(null);

  // Fetch per-category availability so users can see which categories still
  // have topics to generate before they click. Refreshed after each run.
  // On failure we keep the existing button enabled (treat counts as unknown)
  // so a transient counts API blip never blocks the user from generating.
  const loadCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const r = await fetch('/api/admin/topics/counts', { cache: 'no-store' });
      if (!r.ok) throw new Error(`counts HTTP ${r.status}`);
      const data = await r.json();
      setCounts(data);
      setCountsError(false);
    } catch {
      setCounts(null);          // clear stale data so button doesn't stay disabled
      setCountsError(true);
    } finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  // When counts are unavailable, treat as "unknown" (not zero) so the user
  // can still attempt to generate — the server is the source of truth anyway.
  const availableForCategory = counts?.categories?.[category]?.available ?? null;
  const totalForCategory     = counts?.categories?.[category]?.total ?? null;
  const isOutOfTopics        = availableForCategory === 0; // strict 0 only — null = unknown

  function reset() {
    setStatus('idle');
    setProgress({ current: 0, total: 0, topic: '' });
    setLog([]);
    setSummary(null);
    setError('');
  }

  async function generate() {
    reset();
    setStatus('generating');

    try {
      const res = await fetch('/api/admin/bulk-generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ category, count, saveAsDraft: true }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        if (res.status === 409) {
          setLog([{
            kind: 'skipped',
            title: err.existingArticle?.title || 'Already covered',
            reason: friendlyDuplicateCopy({ code: err.code, fallback: err.error }),
            existingArticle: err.existingArticle || null,
            n: 1, total: 1,
          }]);
        } else {
          setError(err.error ?? 'Bulk generation failed.');
        }
        setStatus('idle');
        return;
      }

      const reader  = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
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
            setProgress(p => ({ ...p, current: event.current, total: event.total, topic: event.topic }));
          } else if (event.type === 'saved') {
            setLog(prev => [...prev, { kind: 'saved', title: event.title, slug: event.slug, n: event.current, total: event.total }]);
            setProgress(p => ({ ...p, current: event.current }));
          } else if (event.type === 'skipped') {
            setLog(prev => [...prev, {
              kind: 'skipped',
              title: event.topic,
              reason: friendlyDuplicateCopy({ code: event.code, fallback: event.reason }),
              existingArticle: event.existingArticle || null,
              n: event.current,
              total: event.total,
            }]);
            setProgress(p => ({ ...p, current: event.current }));
          } else if (event.type === 'done') {
            setSummary({ generated: event.generated, skipped: event.skipped });
            setStatus('done');
            // refresh per-category availability so the UI reflects new state
            loadCounts();
            onSaved?.();
          } else if (event.type === 'error') {
            const friendly = event.code
              ? friendlyDuplicateCopy({ code: event.code, fallback: event.message })
              : (event.message || 'Bulk generation failed.');
            setError(friendly);
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
  const isDone       = status === 'done';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Config card ── */}
      <div style={S.card}>
        <p style={{ margin: '0 0 1.5rem', color: '#6b6b6b', fontSize: '0.9rem' }}>
          Pick a category, choose how many articles to generate, and let the system do the rest.
          Articles are saved as drafts — review and publish them from the Dashboard tab.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={S.label}>Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={S.input}
              disabled={isGenerating}
            >
              {CATEGORIES.map(c => {
                const a = counts?.categories?.[c.value]?.available;
                const t = counts?.categories?.[c.value]?.total;
                const suffix = (a == null || t == null)
                  ? ''
                  : a === 0 ? '  — all done' : `  (${a} of ${t} left)`;
                return (
                  <option key={c.value} value={c.value}>
                    {c.label}{suffix}
                  </option>
                );
              })}
            </select>
            {!countsLoading && availableForCategory != null && (
              <p style={{
                margin: '0.4rem 0 0', fontSize: '0.78rem',
                color: isOutOfTopics ? '#b91c1c' : '#5a4a35',
              }}>
                {isOutOfTopics
                  ? `Every topic in this category already has an article. Pick a different category or add new topics.`
                  : `${availableForCategory} of ${totalForCategory} topics in this category still need an article.`}
              </p>
            )}
            {countsError && (
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: '#8b7355' }}>
                Couldn’t load topic counts — you can still try generating.
              </p>
            )}
          </div>
          <div>
            <label style={S.label}>Number of articles (1–20)</label>
            <input
              type="number"
              value={count}
              onChange={e => setCount(Math.min(20, Math.max(1, Number(e.target.value))))}
              min={1} max={20}
              style={S.input}
              disabled={isGenerating}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={generate}
            disabled={isGenerating || isOutOfTopics}
            title={isOutOfTopics ? 'No topics left in this category' : ''}
            style={S.btn('primary', isGenerating || isOutOfTopics)}
          >
            {isGenerating
              ? `⟳ Generating… (${progress.current}/${progress.total || count})`
              : isOutOfTopics
                ? '✓ All articles already created'
                : `✦ Generate ${count} Article${count !== 1 ? 's' : ''}`}
          </button>

          {isDone && !isOutOfTopics && (
            <button onClick={generate} style={S.btn('secondary')}>
              Generate more
            </button>
          )}
        </div>

        {error && (
          <div style={{ marginTop: '1rem', background: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '0.5rem', padding: '0.65rem 0.9rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      {isGenerating && progress.total > 0 && (
        <div style={S.card}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: '600', color: '#1e2d4a', fontSize: '0.9rem' }}>
            {progress.current} of {progress.total} generated…
          </p>
          {progress.topic && (
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#8b7355' }}>
              Current: <em>{progress.topic}</em>
            </p>
          )}
          <div style={{ background: '#f0ece4', borderRadius: '0.5rem', height: '6px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#1e2d4a', borderRadius: '0.5rem',
              width: `${(progress.current / progress.total) * 100}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      {summary && (
        <div style={{ ...S.card, background: '#f3fbf6', border: '1px solid #b7dfc8' }}>
          <p style={{ margin: 0, fontWeight: '700', color: '#1b5e20', fontSize: '1rem' }}>
            ✓ {summary.generated + summary.skipped} processed ({summary.generated} saved, {summary.skipped} skipped)
          </p>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: '#4a7c59' }}>
            All saved as drafts. Go to the Dashboard tab to review and publish them.
          </p>
        </div>
      )}

      {/* ── Activity log ── */}
      {log.length > 0 && (
        <div style={S.card}>
          <p style={{ margin: '0 0 0.875rem', fontWeight: '700', color: '#1e2d4a', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Activity Log
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {log.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.55rem 0.75rem', background: '#f9f5ee', borderRadius: '0.4rem', gap: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '0.75rem', color: '#aaa', marginRight: '0.4rem' }}>{item.n}/{item.total}</span>
                  <span style={{ fontWeight: '600', color: '#1e2d4a', fontSize: '0.875rem', wordBreak: 'break-word' }}>{item.title}</span>
                  {item.kind === 'saved'   && item.slug   && <div style={{ fontSize: '0.73rem', color: '#8b7355', fontFamily: 'monospace', marginTop: '0.1rem' }}>{item.slug}</div>}
                  {item.kind === 'skipped' && item.reason && <div style={{ fontSize: '0.73rem', color: '#856404', marginTop: '0.1rem' }}>{item.reason}</div>}
                  {item.kind === 'skipped' && item.existingArticle && (
                    <div style={{ fontSize: '0.73rem', color: '#6b6b6b', marginTop: '0.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                      <span>Existing:</span>
                      <strong style={{ color: '#1e2d4a' }}>{item.existingArticle.title}</strong>
                      {item.existingArticle.category && (
                        <span style={{
                          padding: '0.05rem 0.4rem', borderRadius: '1rem', fontSize: '0.68rem', fontWeight: '700',
                          background: '#f0ece4', color: '#5a4a35',
                        }}>
                          {categoryLabel(item.existingArticle.category)}
                        </span>
                      )}
                      <span style={{
                        padding: '0.05rem 0.4rem', borderRadius: '1rem', fontSize: '0.68rem', fontWeight: '700',
                        background: item.existingArticle.status === 'published' ? '#dcf5e7' : '#fff3cd',
                        color:      item.existingArticle.status === 'published' ? '#1b5e20' : '#856404',
                      }}>
                        {item.existingArticle.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                      {item.existingArticle.language && (
                        <span style={{
                          padding: '0.05rem 0.4rem', borderRadius: '1rem', fontSize: '0.68rem', fontWeight: '700',
                          background: '#e8f4fd', color: '#1565c0',
                        }}>
                          {languageLabel(item.existingArticle.language)}
                        </span>
                      )}
                      {item.existingArticle.id && (
                        <a
                          href={`/admin/#articles?article_id=${encodeURIComponent(item.existingArticle.id)}`}
                          style={{ color: '#1e2d4a', textDecoration: 'underline', fontWeight: '600' }}
                        >
                          Edit in admin →
                        </a>
                      )}
                      {item.existingArticle.status === 'published' && item.existingArticle.slug && (
                        <a
                          href={(() => {
                            const c = item.existingArticle.category;
                            const s = item.existingArticle.slug;
                            if (c === 'questions')        return `/questions/${s}/`;
                            if (c === 'topics')           return `/topics/${s}/`;
                            if (c === 'bible-characters') return `/bible-characters/${s}/`;
                            if (c === 'bible-verses')     return `/bible-verses/${s}/`;
                            return `/guides/${s}/`;
                          })()}
                          target="_blank" rel="noreferrer"
                          style={{ color: '#5a4a35', textDecoration: 'underline', fontWeight: '500', fontSize: '0.7rem' }}
                        >
                          View live ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <span style={S.badge(item.kind)}>{item.kind === 'saved' ? 'Saved' : 'Skipped'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
