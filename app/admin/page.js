'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── Shared styles ────────────────────────────────────────────────────────────
const S = {
  page:     { maxWidth: '56rem', margin: '0 auto', padding: '2.5rem 1rem', fontFamily: 'Georgia, serif' },
  header:   { marginBottom: '2rem' },
  back:     { color: '#b8860b', textDecoration: 'none', fontSize: '0.875rem' },
  h1:       { fontSize: '1.875rem', fontWeight: 'bold', color: '#1e2d4a', marginTop: '0.5rem', marginBottom: 0 },
  card:     { backgroundColor: 'white', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '2rem', marginBottom: '1.5rem' },
  label:    { display: 'block', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.35rem', fontSize: '0.9rem' },
  input:    { width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' },
  select:   { width: '100%', padding: '0.6rem 0.875rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '1rem', fontFamily: 'inherit', boxSizing: 'border-box', background: 'white', outline: 'none' },
  hint:     { fontSize: '0.8rem', color: '#8b7355', marginTop: '0.25rem' },
  btnRow:   { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.25rem' },
  btnPri:   { backgroundColor: '#1e2d4a', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnGold:  { backgroundColor: '#b8860b', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.7rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  btnGhost: { backgroundColor: 'transparent', color: '#1e2d4a', border: '1px solid #d4c5a9', borderRadius: '0.5rem', padding: '0.7rem 1.25rem', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnSm:    { backgroundColor: 'transparent', color: '#1e2d4a', border: '1px solid #d4c5a9', borderRadius: '0.375rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' },
  btnSmGold:{ backgroundColor: '#b8860b', color: 'white', border: 'none', borderRadius: '0.375rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' },
  tag:      { display: 'inline-block', backgroundColor: '#f5f0e8', color: '#8b7355', fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', border: '1px solid #e8dfc8', marginRight: '0.35rem', marginBottom: '0.35rem' },
  metaRow:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
  metaBox:  { backgroundColor: '#f9f5ee', borderRadius: '0.5rem', padding: '0.875rem', border: '1px solid #e8dfc8' },
  metaKey:  { fontSize: '0.75rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' },
  metaVal:  { fontSize: '0.875rem', color: '#1e2d4a', lineHeight: 1.5 },
  alertErr: { backgroundColor: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '0.5rem', padding: '0.875rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' },
  alertOk:  { backgroundColor: '#f0fff4', border: '1px solid #b2dfdb', color: '#1b5e20', borderRadius: '0.5rem', padding: '0.875rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' },
  divider:  { border: 'none', borderTop: '1px solid #e8dfc8', margin: '1.5rem 0' },
  slug:     { fontFamily: 'monospace', backgroundColor: '#f5f0e8', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.9em' },
  prose:    { lineHeight: 1.75, color: '#2a2a2a', fontSize: '0.95rem' },
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  pending:    { bg: '#f5f0e8', color: '#8b7355', label: 'Pending' },
  generating: { bg: '#e8f4fd', color: '#1a5276', label: 'Generating…' },
  generated:  { bg: '#fef9e7', color: '#784212', label: 'Ready to save' },
  saving:     { bg: '#e8f4fd', color: '#1a5276', label: 'Saving…' },
  saved:      { bg: '#f0fff4', color: '#1b5e20', label: 'Saved ✓' },
  error:      { bg: '#fff0f0', color: '#7b2020', label: 'Error' },
  discarded:  { bg: '#f5f5f5', color: '#999',    label: 'Discarded' },
};

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.pending;
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontFamily: 'sans-serif' }}>
      {s.label}
    </span>
  );
}

// ─── Single-article preview card (reused in both tabs) ───────────────────────
function PreviewCard({ preview, onSave, onDiscard, onRegenerate, saving, error }) {
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Preview — not yet saved
          </p>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#1e2d4a', margin: '0.25rem 0 0' }}>
            {preview.title}
          </h2>
        </div>
        <div style={S.btnRow}>
          <button style={S.btnGold} onClick={onSave} disabled={saving}>{saving ? 'Saving…' : '✓ Save to Database'}</button>
          {onRegenerate && <button style={S.btnGhost} onClick={onRegenerate} disabled={saving}>↻ Regenerate</button>}
        </div>
      </div>

      <hr style={S.divider} />

      <div style={S.metaRow}>
        <div style={S.metaBox}>
          <div style={S.metaKey}>Meta Title</div>
          <div style={S.metaVal}>{preview.metaTitle}</div>
          <div style={{ ...S.hint, marginTop: '0.35rem' }}>{preview.metaTitle?.length} chars</div>
        </div>
        <div style={S.metaBox}>
          <div style={S.metaKey}>Meta Description</div>
          <div style={S.metaVal}>{preview.metaDescription}</div>
          <div style={{ ...S.hint, marginTop: '0.35rem' }}>{preview.metaDescription?.length} chars</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div style={S.metaBox}>
          <div style={S.metaKey}>Slug</div>
          <div style={S.metaVal}><span style={S.slug}>{preview.slug}</span></div>
        </div>
        <div style={S.metaBox}>
          <div style={S.metaKey}>Topic</div>
          <div style={S.metaVal}>{preview.topicName ?? '—'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={S.metaKey}>Keywords</div>
        <div style={{ marginTop: '0.35rem' }}>
          {(preview.keywords ?? []).map((k) => <span key={k} style={S.tag}>{k}</span>)}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={S.metaKey}>Related Slugs</div>
        <div style={{ marginTop: '0.35rem' }}>
          {(preview.relatedSlugs ?? []).length > 0
            ? preview.relatedSlugs.map((s) => <span key={s} style={S.tag}>{s}</span>)
            : <span style={{ color: '#8b7355', fontSize: '0.85rem' }}>None resolved</span>}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={S.metaKey}>Summary</div>
        <p style={{ ...S.metaVal, margin: '0.35rem 0 0', fontStyle: 'italic', color: '#5a5a5a' }}>{preview.summary}</p>
      </div>

      <hr style={S.divider} />
      <div style={S.metaKey}>Article Content</div>
      <div className="prose-content" style={{ ...S.prose, marginTop: '0.75rem' }} dangerouslySetInnerHTML={{ __html: preview.contentHtml }} />
      <hr style={S.divider} />

      <div style={S.btnRow}>
        <button style={S.btnGold} onClick={onSave} disabled={saving}>{saving ? 'Saving…' : '✓ Save to Database'}</button>
        {onDiscard && <button style={S.btnGhost} onClick={onDiscard}>Discard</button>}
      </div>
      {error && <div style={{ ...S.alertErr, marginTop: '1rem' }}>{error}</div>}
    </div>
  );
}

// ─── Batch article row (collapsed / expanded) ────────────────────────────────
function BatchArticleRow({ item, index, onSave, onDiscard }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const isSaveable  = item.status === 'generated';
  const isDiscarded = item.status === 'discarded';
  const isSaved     = item.status === 'saved';

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/save-question/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });
      const d = await res.json();
      if (!res.ok) { setSaveError(d.error ?? 'Save failed'); }
      else { onSave(index, d.question); setExpanded(false); }
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ border: '1px solid #e8dfc8', borderRadius: '0.75rem', marginBottom: '0.75rem', overflow: 'hidden', opacity: isDiscarded ? 0.5 : 1 }}>
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', backgroundColor: '#faf7f2', flexWrap: 'wrap' }}>
        <span style={{ minWidth: '1.5rem', fontWeight: 'bold', color: '#8b7355', fontSize: '0.85rem' }}>#{index + 1}</span>
        <span style={{ flex: 1, fontFamily: 'Georgia, serif', color: '#1e2d4a', fontSize: '0.95rem' }}>{item.idea.title}</span>
        <StatusBadge status={item.status} />
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          {isSaveable && (
            <>
              <button style={S.btnSmGold} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              <button style={S.btnSm} onClick={() => onDiscard(index)}>Discard</button>
            </>
          )}
          {isSaved && item.savedQuestion && (
            <Link href={`/questions/${item.savedQuestion.slug}/`} style={{ ...S.btnSm, textDecoration: 'none', color: '#1b5e20', border: '1px solid #b2dfdb' }}>
              View →
            </Link>
          )}
          {item.status === 'generated' || item.status === 'error' ? (
            <button style={S.btnSm} onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Collapse' : 'Expand'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Error inline */}
      {item.status === 'error' && item.error && (
        <div style={{ padding: '0.75rem 1.25rem', backgroundColor: '#fff0f0', color: '#7b2020', fontSize: '0.85rem' }}>
          {item.error}
        </div>
      )}

      {/* Expanded content */}
      {expanded && item.data && (
        <div style={{ padding: '1.5rem', borderTop: '1px solid #e8dfc8' }}>
          <div style={S.metaRow}>
            <div style={S.metaBox}>
              <div style={S.metaKey}>Meta Title</div>
              <div style={S.metaVal}>{item.data.metaTitle}</div>
              <div style={{ ...S.hint, marginTop: '0.25rem' }}>{item.data.metaTitle?.length} chars</div>
            </div>
            <div style={S.metaBox}>
              <div style={S.metaKey}>Meta Description</div>
              <div style={S.metaVal}>{item.data.metaDescription}</div>
              <div style={{ ...S.hint, marginTop: '0.25rem' }}>{item.data.metaDescription?.length} chars</div>
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={S.metaKey}>Slug</div>
            <span style={S.slug}>{item.data.slug}</span>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={S.metaKey}>Keywords</div>
            <div style={{ marginTop: '0.35rem' }}>
              {(item.data.keywords ?? []).map((k) => <span key={k} style={S.tag}>{k}</span>)}
            </div>
          </div>
          <hr style={S.divider} />
          <div style={S.metaKey}>Article Content</div>
          <div className="prose-content" style={{ ...S.prose, marginTop: '0.75rem' }} dangerouslySetInnerHTML={{ __html: item.data.contentHtml }} />
          <hr style={S.divider} />
          {isSaveable && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={S.btnGold} onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : '✓ Save to Database'}</button>
              <button style={S.btnGhost} onClick={() => { onDiscard(index); setExpanded(false); }}>Discard</button>
            </div>
          )}
          {saveError && <div style={{ ...S.alertErr, marginTop: '1rem' }}>{saveError}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#1e2d4a', fontFamily: 'sans-serif' }}>Generating articles…</span>
        <span style={{ fontSize: '0.85rem', color: '#8b7355', fontFamily: 'sans-serif' }}>{current} / {total}</span>
      </div>
      <div style={{ height: '6px', backgroundColor: '#e8dfc8', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#b8860b', borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main admin page
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const [topics, setTopics] = useState([]);
  const [tab,    setTab]    = useState('single'); // 'single' | 'batch'

  useEffect(() => {
    fetch('/api/topics/')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setTopics(d); })
      .catch(() => {});
  }, []);

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <Link href="/" style={S.back}>← Back to site</Link>
        <h1 style={S.h1}>Content Generator</h1>
        <p style={{ color: '#5a5a5a', marginTop: '0.25rem', fontSize: '0.9rem' }}>
          AI-powered pipeline for creating and publishing Bible study articles.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem', border: '1px solid #e8dfc8', borderRadius: '0.75rem', overflow: 'hidden', width: 'fit-content' }}>
        {[['single', 'Single Article'], ['batch', 'Batch Generate']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: '0.6rem 1.5rem', fontSize: '0.9rem', fontFamily: 'inherit',
              fontWeight: tab === id ? '600' : '400', cursor: 'pointer', border: 'none',
              backgroundColor: tab === id ? '#1e2d4a' : 'white',
              color: tab === id ? 'white' : '#5a5a5a',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'single' && <SingleTab topics={topics} />}
      {tab === 'batch'  && <BatchTab  topics={topics} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Single article tab (original functionality, unchanged)
// ═══════════════════════════════════════════════════════════════════════════════
function SingleTab({ topics }) {
  const [topic,    setTopic]    = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [preview,  setPreview]  = useState(null);
  const [error,    setError]    = useState('');
  const [saved,    setSaved]    = useState(null);

  async function handleGenerate(e) {
    if (e?.preventDefault) e.preventDefault();
    if (!topic.trim()) { setError('Please select or enter a topic.'); return; }
    setError(''); setPreview(null); setSaved(null); setLoading(true);
    try {
      const kwArray = keywords.split(',').map((k) => k.trim()).filter(Boolean);
      const res = await fetch('/api/generate-question/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), keywords: kwArray }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? `Generation failed (${res.status})`);
      else setPreview(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!preview) return;
    setError(''); setSaving(true);
    try {
      const res = await fetch('/api/save-question/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preview),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? `Save failed (${res.status})`);
      else { setSaved(data.question); setPreview(null); setTopic(''); setKeywords(''); }
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <>
      {saved && (
        <div style={S.alertOk}>
          <strong>Saved!</strong> <em>{saved.title}</em> is live at{' '}
          <Link href={`/questions/${saved.slug}/`} style={{ color: '#1b5e20' }}>/questions/{saved.slug}/</Link>
          <button onClick={() => setSaved(null)} style={{ ...S.btnSm, marginLeft: '1rem' }}>Generate another</button>
        </div>
      )}

      <div style={S.card}>
        <form onSubmit={handleGenerate}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Topic</label>
            {topics.length > 0 ? (
              <select style={S.select} value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">— Select a topic —</option>
                {topics.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            ) : (
              <input style={S.input} placeholder="e.g. Grace, Faith, Prayer…" value={topic} onChange={(e) => setTopic(e.target.value)} />
            )}
            <p style={S.hint}>The topic this article belongs to.</p>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Focus Keywords <span style={{ fontWeight: 400, color: '#8b7355' }}>(optional)</span></label>
            <input style={S.input} placeholder="e.g. what is forgiveness, how to forgive" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            <p style={S.hint}>Comma-separated. Leave blank to let AI decide.</p>
          </div>
          {error && <div style={S.alertErr}>{error}</div>}
          <div style={S.btnRow}>
            <button type="submit" style={S.btnPri} disabled={loading}>{loading ? 'Generating…' : '✦ Generate Article'}</button>
            {preview && !loading && <button type="button" style={S.btnGhost} onClick={() => { setPreview(null); setError(''); }}>Clear</button>}
          </div>
        </form>
      </div>

      {loading && (
        <div style={{ ...S.card, textAlign: 'center', color: '#8b7355', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✦</div>
          <p style={{ margin: 0 }}>Writing article — this takes 10–20 seconds…</p>
        </div>
      )}

      {preview && !loading && (
        <PreviewCard
          preview={preview}
          onSave={handleSave}
          onDiscard={() => { setPreview(null); setError(''); }}
          onRegenerate={handleGenerate}
          saving={saving}
          error={error}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Batch generate tab
// ═══════════════════════════════════════════════════════════════════════════════
function BatchTab({ topics }) {
  const [topic,     setTopic]     = useState('');
  const [count,     setCount]     = useState(3);
  const [mode,      setMode]      = useState('preview'); // 'preview' | 'autosave'
  const [step,      setStep]      = useState('idle');    // 'idle'|'ideas-loading'|'ideas-ready'|'running'|'done'
  const [ideas,     setIdeas]     = useState([]);        // [{title, keywords, selected}]
  const [items,     setItems]     = useState([]);        // batch article items
  const [progress,  setProgress]  = useState({ current: 0, total: 0 });
  const [batchErr,  setBatchErr]  = useState('');
  const [savedCount,setSavedCount]= useState(0);

  const itemsRef = useRef([]);

  function reset() {
    setStep('idle'); setIdeas([]); setItems([]); setBatchErr('');
    setProgress({ current: 0, total: 0 }); setSavedCount(0);
    itemsRef.current = [];
  }

  // ── Step 1: Generate ideas ─────────────────────────────────────────────────
  async function handleGenerateIdeas(e) {
    e.preventDefault();
    if (!topic.trim()) { setBatchErr('Please select a topic.'); return; }
    setBatchErr(''); setStep('ideas-loading'); setIdeas([]); setItems([]);
    try {
      const res = await fetch('/api/generate-ideas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), count }),
      });
      const data = await res.json();
      if (!res.ok) { setBatchErr(data.error ?? 'Failed to generate ideas'); setStep('idle'); return; }
      setIdeas(data.ideas.map((idea) => ({ ...idea, selected: true })));
      setStep('ideas-ready');
    } catch (err) { setBatchErr(err.message); setStep('idle'); }
  }

  // ── Step 2: Generate articles ──────────────────────────────────────────────
  async function handleGenerateArticles() {
    const selected = ideas.filter((i) => i.selected);
    if (!selected.length) { setBatchErr('Select at least one idea.'); return; }

    setBatchErr('');
    const initial = selected.map((idea) => ({ idea, status: 'pending', data: null, error: null, savedQuestion: null }));
    itemsRef.current = initial;
    setItems([...initial]);
    setProgress({ current: 0, total: selected.length });
    setSavedCount(0);
    setStep('running');

    let saved = 0;

    for (let i = 0; i < selected.length; i++) {
      // Mark generating
      itemsRef.current[i].status = 'generating';
      setItems([...itemsRef.current]);

      try {
        // Generate article
        const genRes = await fetch('/api/generate-question/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topic.trim(), keywords: selected[i].keywords }),
        });
        const genData = await genRes.json();

        if (!genRes.ok) {
          itemsRef.current[i].status = 'error';
          itemsRef.current[i].error  = genData.error ?? `HTTP ${genRes.status}`;
        } else {
          itemsRef.current[i].data = genData;

          if (mode === 'autosave') {
            // Auto-save immediately
            itemsRef.current[i].status = 'saving';
            setItems([...itemsRef.current]);

            const saveRes = await fetch('/api/save-question/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(genData),
            });
            const saveData = await saveRes.json();

            if (!saveRes.ok) {
              itemsRef.current[i].status = 'error';
              itemsRef.current[i].error  = saveData.error ?? 'Save failed';
            } else {
              itemsRef.current[i].status       = 'saved';
              itemsRef.current[i].savedQuestion = saveData.question;
              saved++;
              setSavedCount(saved);
            }
          } else {
            itemsRef.current[i].status = 'generated';
          }
        }
      } catch (err) {
        itemsRef.current[i].status = 'error';
        itemsRef.current[i].error  = err.message;
      }

      setProgress({ current: i + 1, total: selected.length });
      setItems([...itemsRef.current]);
    }

    setStep('done');
  }

  // ── Batch save-all (preview mode) ──────────────────────────────────────────
  async function handleSaveAll() {
    const unsaved = itemsRef.current.filter((it) => it.status === 'generated');
    for (let i = 0; i < itemsRef.current.length; i++) {
      if (itemsRef.current[i].status !== 'generated') continue;
      itemsRef.current[i].status = 'saving';
      setItems([...itemsRef.current]);
      try {
        const res = await fetch('/api/save-question/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemsRef.current[i].data),
        });
        const d = await res.json();
        if (!res.ok) { itemsRef.current[i].status = 'error'; itemsRef.current[i].error = d.error; }
        else { itemsRef.current[i].status = 'saved'; itemsRef.current[i].savedQuestion = d.question; }
      } catch (err) { itemsRef.current[i].status = 'error'; itemsRef.current[i].error = err.message; }
      setItems([...itemsRef.current]);
    }
  }

  function handleItemSave(index, question) {
    itemsRef.current[index].status       = 'saved';
    itemsRef.current[index].savedQuestion = question;
    setItems([...itemsRef.current]);
  }

  function handleItemDiscard(index) {
    itemsRef.current[index].status = 'discarded';
    setItems([...itemsRef.current]);
  }

  const isRunning    = step === 'running';
  const generatedQty = items.filter((it) => it.status === 'generated').length;
  const savedQty     = items.filter((it) => it.status === 'saved').length;

  return (
    <>
      {/* ── Form ── */}
      {(step === 'idle' || step === 'ideas-loading') && (
        <div style={S.card}>
          <form onSubmit={handleGenerateIdeas}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Topic</label>
              {topics.length > 0 ? (
                <select style={S.select} value={topic} onChange={(e) => setTopic(e.target.value)}>
                  <option value="">— Select a topic —</option>
                  {topics.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              ) : (
                <input style={S.input} placeholder="e.g. Grace, Faith, Prayer…" value={topic} onChange={(e) => setTopic(e.target.value)} />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={S.label}>Number of Articles</label>
                <select style={S.select} value={count} onChange={(e) => setCount(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} article{n > 1 ? 's' : ''}</option>)}
                </select>
                <p style={S.hint}>Maximum 5 per run.</p>
              </div>
              <div>
                <label style={S.label}>After Generation</label>
                <select style={S.select} value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="preview">Preview each — save manually</option>
                  <option value="autosave">Auto-save all</option>
                </select>
                <p style={S.hint}>Preview lets you review before saving.</p>
              </div>
            </div>

            {batchErr && <div style={S.alertErr}>{batchErr}</div>}

            <div style={S.btnRow}>
              <button type="submit" style={S.btnPri} disabled={step === 'ideas-loading'}>
                {step === 'ideas-loading' ? 'Generating ideas…' : '✦ Step 1 — Generate Ideas'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Ideas checklist ── */}
      {(step === 'ideas-ready' || step === 'running' || step === 'done') && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 1 — Ideas</p>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1e2d4a', margin: '0.2rem 0 0' }}>
                {ideas.length} question ideas for <em>{topic}</em>
              </h3>
            </div>
            {step === 'ideas-ready' && (
              <button style={S.btnGhost} onClick={reset}>← Start over</button>
            )}
          </div>

          {ideas.map((idea, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: idea.selected ? '#f9f5ee' : '#fafafa', borderRadius: '0.5rem', border: `1px solid ${idea.selected ? '#e8dfc8' : '#ececec'}`, cursor: step === 'ideas-ready' ? 'pointer' : 'default' }}>
              <input
                type="checkbox"
                checked={idea.selected}
                disabled={step !== 'ideas-ready'}
                onChange={() => {
                  const next = [...ideas];
                  next[i] = { ...next[i], selected: !next[i].selected };
                  setIdeas(next);
                }}
                style={{ marginTop: '0.2rem', accentColor: '#b8860b', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontFamily: 'Georgia, serif', color: '#1e2d4a', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{idea.title}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {idea.keywords.map((k) => <span key={k} style={S.tag}>{k}</span>)}
                </div>
              </div>
            </label>
          ))}

          {step === 'ideas-ready' && (
            <div style={S.btnRow}>
              <button style={S.btnGold} onClick={handleGenerateArticles} disabled={!ideas.some((i) => i.selected)}>
                ✦ Step 2 — Generate {ideas.filter((i) => i.selected).length} Article{ideas.filter((i) => i.selected).length !== 1 ? 's' : ''}
                {mode === 'autosave' ? ' & Auto-Save' : ' (Preview)'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Article generation progress & results ── */}
      {(step === 'running' || step === 'done') && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 2 — Articles</p>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1e2d4a', margin: '0.2rem 0 0' }}>
                {step === 'done'
                  ? mode === 'autosave'
                    ? `${savedQty} of ${items.length} articles saved`
                    : `${generatedQty} article${generatedQty !== 1 ? 's' : ''} ready to save`
                  : 'Generating articles…'}
              </h3>
            </div>
            {step === 'done' && mode === 'preview' && generatedQty > 0 && (
              <button style={S.btnGold} onClick={handleSaveAll}>✓ Save All ({generatedQty})</button>
            )}
            {step === 'done' && (
              <button style={S.btnGhost} onClick={reset}>Generate more</button>
            )}
          </div>

          {isRunning && <ProgressBar current={progress.current} total={progress.total} />}

          {step === 'done' && mode === 'autosave' && (
            <div style={{ ...S.alertOk, marginBottom: '1rem' }}>
              {savedQty} article{savedQty !== 1 ? 's' : ''} published successfully.
              {items.filter((it) => it.status === 'error').length > 0 &&
                ` ${items.filter((it) => it.status === 'error').length} failed — check errors below.`}
            </div>
          )}

          {items.map((item, i) => (
            <BatchArticleRow
              key={i}
              index={i}
              item={item}
              onSave={handleItemSave}
              onDiscard={handleItemDiscard}
            />
          ))}
        </div>
      )}
    </>
  );
}
