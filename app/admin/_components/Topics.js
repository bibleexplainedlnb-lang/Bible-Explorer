'use client';

import { useState, useEffect } from 'react';
import { CATEGORIES } from '../../../lib/categories.js';

const S = {
  card:     { background: '#fff', border: '1px solid #e8dfc8', borderRadius: '1rem', padding: '1.75rem' },
  label:    { display: 'block', fontWeight: 'bold', color: '#1e2d4a', marginBottom: '0.4rem', fontSize: '0.9rem' },
  input:    { width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#000' },
  btn:      { backgroundColor: '#1e2d4a', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.65rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
  tab:      (active) => ({
    padding: '0.35rem 0.85rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
    border: 'none', fontFamily: 'inherit',
    background: active ? '#1e2d4a' : '#f5f0e8',
    color:      active ? 'white'   : '#5a4a35',
  }),
  pillarBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: '#fff3cd', color: '#856404', fontSize: '0.7rem', fontWeight: '700', padding: '0.1rem 0.5rem', borderRadius: '1rem', border: '1px solid #ffc107' },
  createdBadge:{ color: '#1b5e20', fontSize: '0.78rem', fontWeight: '600' },
  pendingBadge:{ color: '#aaa', fontSize: '0.78rem' },
};

export default function Topics() {
  const [topics,      setTopics]      = useState([]);
  const [activeTab,   setActiveTab]   = useState(CATEGORIES[0].value);
  const [showCreated, setShowCreated] = useState(true);
  const [name,        setName]        = useState('');
  const [cat,         setCat]         = useState(CATEGORIES[0].value);
  const [isPillar,    setIsPillar]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [pillarLoading, setPillarLoading] = useState(null);

  async function load() {
    try {
      const res = await fetch('/api/admin/topics');
      const d   = await res.json();
      if (Array.isArray(d)) setTopics(d);
    } catch (err) {
      console.error('[Topics] load error:', err);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Topic name is required.'); return; }
    setError(''); setSaving(true);
    try {
      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), category: cat, is_pillar: isPillar }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to add topic.'); setSaving(false); return; }
      setName(''); setIsPillar(false);
      setSuccess(`Topic "${data.name}" added!`);
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  async function togglePillar(topic) {
    setPillarLoading(topic.id);
    try {
      await fetch(`/api/admin/topics/${topic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pillar: !topic.is_pillar }),
      });
      load();
    } catch (err) {
      console.error('togglePillar error:', err);
    }
    setPillarLoading(null);
  }

  const tabTopics = topics.filter(t => t.category === activeTab);
  const visibleTopics = showCreated
    ? tabTopics
    : tabTopics.filter(t => !t.article_created);
  const sortedTopics = [...visibleTopics].sort((a, b) => {
    if (a.is_pillar && !b.is_pillar) return -1;
    if (!a.is_pillar && b.is_pillar) return 1;
    return a.name.localeCompare(b.name);
  });

  const createdCount = tabTopics.filter(t => t.article_created).length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>

      {/* Add form */}
      <div style={S.card}>
        <h3 style={{ fontFamily: 'Georgia,serif', margin: '0 0 1.25rem', color: '#1e2d4a', fontSize: '1.05rem' }}>Add New Topic</h3>
        <form onSubmit={handleAdd}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Topic Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. David, The Sermon on the Mount"
              style={S.input}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Category</label>
            <select value={cat} onChange={e => setCat(e.target.value)} style={S.input}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              id="is-pillar-cb" type="checkbox" checked={isPillar}
              onChange={e => setIsPillar(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#b8860b' }}
            />
            <label htmlFor="is-pillar-cb" style={{ ...S.label, display: 'inline', margin: 0, cursor: 'pointer' }}>
              Is Pillar Topic
            </label>
          </div>

          {error   && <div style={{ background:'#fff0f0', border:'1px solid #f5c6c6', color:'#7b2020', borderRadius:'0.5rem', padding:'0.6rem 0.9rem', marginBottom:'0.75rem', fontSize:'0.85rem' }}>{error}</div>}
          {success && <div style={{ background:'#f0fff4', border:'1px solid #b2dfdb', color:'#1b5e20', borderRadius:'0.5rem', padding:'0.6rem 0.9rem', marginBottom:'0.75rem', fontSize:'0.85rem' }}>{success}</div>}

          <button type="submit" disabled={saving} style={{ ...S.btn, opacity: saving ? 0.7 : 1, width: '100%' }}>
            {saving ? 'Adding…' : '+ Add Topic'}
          </button>
        </form>
      </div>

      {/* Topics list */}
      <div>
        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {CATEGORIES.map(c => {
            const count = topics.filter(t => t.category === c.value).length;
            return (
              <button key={c.value} onClick={() => setActiveTab(c.value)} style={S.tab(activeTab === c.value)}>
                {c.label} {count > 0 && <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Show created toggle + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.875rem', fontSize: '0.82rem', color: '#8b7355' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
            <input
              type="checkbox" checked={showCreated}
              onChange={e => setShowCreated(e.target.checked)}
              style={{ accentColor: '#1e2d4a' }}
            />
            Show Created Topics
          </label>
          {createdCount > 0 && (
            <span>{createdCount} of {tabTopics.length} created</span>
          )}
        </div>

        <div style={S.card}>
          {sortedTopics.length === 0 ? (
            <p style={{ margin: 0, color: '#aaa', fontSize: '0.875rem' }}>
              {tabTopics.length === 0
                ? `No ${CATEGORIES.find(c => c.value === activeTab)?.label} topics yet — add one!`
                : 'All topics in this category have been created. Toggle "Show Created" to see them.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sortedTopics.map(t => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                  padding: '0.6rem 0.875rem', background: '#f9f5ee', borderRadius: '0.5rem',
                  border: '1px solid #e8dfc8', opacity: t.article_created ? 0.75 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                    {t.is_pillar && <span style={S.pillarBadge}>★ Pillar</span>}
                    <span style={{ fontWeight: '500', color: '#1e2d4a', fontSize: '0.9rem', wordBreak: 'break-word' }}>{t.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    <span style={t.article_created ? S.createdBadge : S.pendingBadge}>
                      {t.article_created ? '✔ Created' : '⬜'}
                    </span>
                    <button
                      onClick={() => togglePillar(t)}
                      disabled={pillarLoading === t.id}
                      title={t.is_pillar ? 'Remove pillar' : 'Mark as pillar'}
                      style={{
                        padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.72rem', fontWeight: '600',
                        cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                        background: t.is_pillar ? '#fff3cd' : '#f0ece4',
                        color:      t.is_pillar ? '#856404' : '#aaa',
                        opacity: pillarLoading === t.id ? 0.6 : 1,
                      }}
                    >
                      {pillarLoading === t.id ? '…' : t.is_pillar ? '★ Pillar' : '☆ Set Pillar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
