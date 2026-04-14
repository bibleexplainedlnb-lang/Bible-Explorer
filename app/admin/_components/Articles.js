'use client';

import { useState, useEffect, useCallback } from 'react';

const BADGE = {
  published: { background: '#dcf5e7', color: '#1b5e20' },
  draft:     { background: '#fff3cd', color: '#856404' },
  rejected:  { background: '#fde8e8', color: '#7b2020' },
};

const S = {
  card:       { background: '#fff', border: '1px solid #e8dfc8', borderRadius: '0.875rem', padding: '1.5rem' },
  th:         { padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: '#6b6b6b', textAlign: 'left', borderBottom: '1px solid #e8dfc8', whiteSpace: 'nowrap' },
  td:         { padding: '0.65rem 1rem', fontSize: '0.875rem', color: '#2a2a2a', borderBottom: '1px solid #f5f0e8', verticalAlign: 'top' },
  badge:      (s) => ({ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '600', ...( BADGE[s] || BADGE.draft) }),
  select:     { padding: '0.4rem 0.75rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '0.85rem', fontFamily: 'inherit', background: '#fff' },
  btn:        (variant='default') => ({
    padding: '0.3rem 0.75rem', borderRadius: '0.4rem', fontSize: '0.78rem', fontWeight: '600',
    cursor: 'pointer', fontFamily: 'inherit', border: 'none',
    ...(variant === 'default'  ? { background: '#f0ece4', color: '#1e2d4a' } :
        variant === 'publish'  ? { background: '#dcf5e7', color: '#1b5e20' } :
        variant === 'draft'    ? { background: '#fff3cd', color: '#856404' } :
        variant === 'reject'   ? { background: '#fde8e8', color: '#7b2020' } :
        variant === 'delete'   ? { background: '#fde8e8', color: '#7b2020' } :
        variant === 'improve'  ? { background: '#ede9fe', color: '#4c1d95' } :
        variant === 'primary'  ? { background: '#1e2d4a', color: '#fff', padding: '0.55rem 1.25rem', fontSize: '0.9rem' } :
        variant === 'ghost'    ? { background: 'transparent', color: '#6b6b6b', border: '1px solid #d4c5a9', padding: '0.55rem 1.25rem', fontSize: '0.9rem' } : {}),
  }),
  input:      { width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #d4c5a9', borderRadius: '0.5rem', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#000' },
  label:      { display: 'block', fontWeight: '600', color: '#1e2d4a', marginBottom: '0.35rem', fontSize: '0.85rem' },
  fieldWrap:  { marginBottom: '1rem' },
};

function Toast({ toast, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isError = toast.status === 'error';
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 2000,
      background: isError ? '#fff0f0' : '#f0fdf4',
      border: `1px solid ${isError ? '#f5c6c6' : '#bbf7d0'}`,
      color: isError ? '#7b2020' : '#166534',
      borderRadius: '0.75rem', padding: '0.85rem 1.25rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      maxWidth: '380px', fontSize: '0.875rem', lineHeight: 1.45,
    }}>
      <div style={{ fontWeight: '700', marginBottom: '0.2rem' }}>
        {isError ? '✗ Failed' : '✓ Done'}
      </div>
      <div style={{ color: isError ? '#a33' : '#15803d' }}>{toast.message}</div>
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: '0.5rem', right: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#aaa', lineHeight: 1 }}
      >×</button>
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', maxWidth: '420px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <p style={{ margin: '0 0 0.5rem', fontWeight: '700', fontSize: '1.05rem', color: '#1e2d4a' }}>{title}</p>
        <p style={{ margin: '0 0 1.75rem', color: '#6b6b6b', fontSize: '0.9rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={S.btn('ghost')}>Cancel</button>
          <button onClick={onConfirm} style={{ ...S.btn('delete'), padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ article, onSave, onClose }) {
  const [form, setForm] = useState({
    title:            article.title            || '',
    slug:             article.slug             || '',
    category:         article.category         || '',
    status:           article.status           || 'draft',
    meta_title:       article.meta_title       || '',
    meta_description: article.meta_description || '',
    content:          article.content          || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) { setError('Title and slug are required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); setSaving(false); return; }
      onSave(data);
    } catch (err) {
      setError(err.message); setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', maxWidth: '680px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem', color: '#1e2d4a' }}>Edit Article</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#aaa', lineHeight: 1 }}>×</button>
        </div>

        {error && (
          <div style={{ background: '#fff0f0', border: '1px solid #f5c6c6', color: '#7b2020', borderRadius: '0.5rem', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={S.fieldWrap}>
            <label style={S.label}>Title</label>
            <input value={form.title} onChange={set('title')} style={S.input} />
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>Slug</label>
            <input value={form.slug} onChange={set('slug')} style={S.input} />
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>Category</label>
            <select value={form.category} onChange={set('category')} style={{ ...S.input }}>
              <option value="">— select —</option>
              <option value="questions">Questions</option>
              <option value="guides">Guides</option>
              <option value="topics">Topics</option>
            </select>
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>Status</label>
            <select value={form.status} onChange={set('status')} style={{ ...S.input }}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>Meta Title</label>
            <input value={form.meta_title} onChange={set('meta_title')} style={S.input} />
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>Meta Description</label>
            <input value={form.meta_description} onChange={set('meta_description')} style={S.input} />
          </div>
        </div>

        <div style={S.fieldWrap}>
          <label style={S.label}>Content (HTML)</label>
          <textarea
            value={form.content} onChange={set('content')}
            rows={10}
            style={{ ...S.input, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button onClick={onClose} style={S.btn('ghost')} disabled={saving}>Cancel</button>
          <button onClick={handleSave} style={S.btn('primary')} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Articles() {
  const [articles,   setArticles]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState({ status: '', category: '' });
  const [editing,    setEditing]    = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [actioning,  setActioning]  = useState(null);
  const [improving,  setImproving]  = useState(new Set());
  const [relinking,  setRelinking]  = useState(false);
  const [toast,      setToast]      = useState(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status)   params.set('status',   filter.status);
      if (filter.category) params.set('category', filter.category);
      const res = await fetch(`/api/admin/articles?${params}`);
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[Articles] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  async function setStatus(article, newStatus) {
    setActioning(article.id + newStatus);
    await fetch(`/api/admin/articles/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setActioning(null);
    loadArticles();
  }

  async function confirmDelete() {
    if (!deleting) return;
    await fetch(`/api/admin/articles/${deleting.id}`, { method: 'DELETE' });
    setDeleting(null);
    loadArticles();
  }

  function handleEditSaved(updated) {
    setEditing(null);
    setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
  }

  async function relinkAll() {
    setRelinking(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/articles/relink', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) {
        setToast({ status: 'error', message: data.error || 'Re-link failed' });
      } else {
        setToast({ status: 'success', message: data.message || `Re-linked ${data.updated} articles.` });
        loadArticles();
      }
    } catch (err) {
      setToast({ status: 'error', message: err.message });
    } finally {
      setRelinking(false);
    }
  }

  async function improveArticle(article) {
    setImproving(prev => new Set([...prev, article.id]));
    setToast(null);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}/improve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setToast({ status: 'error', message: data.error || 'Something went wrong' });
      } else {
        setArticles(prev => prev.map(a => a.id === data.id ? data : a));
        setToast({ status: 'success', message: `"${article.title}" has been rewritten and enriched with internal links.` });
      }
    } catch (err) {
      setToast({ status: 'error', message: err.message });
    } finally {
      setImproving(prev => { const s = new Set(prev); s.delete(article.id); return s; });
    }
  }

  const fmt = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {editing  && <EditModal article={editing}  onSave={handleEditSaved} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmModal
          title="Delete article?"
          message={`"${deleting.title}" will be permanently removed. This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', color: '#6b6b6b', fontWeight: '600' }}>
          {loading ? 'Loading…' : `${articles.length} article${articles.length !== 1 ? 's' : ''}`}
        </span>

        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} style={S.select}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </select>

        <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))} style={S.select}>
          <option value="">All categories</option>
          <option value="questions">Questions</option>
          <option value="guides">Guides</option>
          <option value="topics">Topics</option>
        </select>

        <button onClick={loadArticles} style={{ ...S.btn('default'), padding: '0.4rem 0.85rem' }}>↻ Refresh</button>

        <button
          onClick={relinkAll}
          disabled={relinking}
          title="Strip old enrichment and re-run internal linking on all articles using the current article pool"
          style={{ ...S.btn('improve'), padding: '0.4rem 0.85rem', opacity: relinking ? 0.6 : 1 }}
        >
          {relinking ? '⟳ Re-linking…' : '🔗 Re-link All'}
        </button>
      </div>

      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8b7355' }}>Loading articles…</div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8b7355' }}>
            No articles found. Generate some using the Bulk Generate tab.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9f5ee' }}>
                <tr>
                  <th style={S.th}>Title</th>
                  <th style={S.th}>Category</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Created</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(a => {
                  const busy      = actioning && actioning.startsWith(a.id);
                  const isImproving = improving.has(a.id);
                  return (
                    <tr key={a.id} style={{ opacity: (busy || isImproving) ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                      <td style={{ ...S.td, maxWidth: '320px' }}>
                        <span style={{ color: '#1e2d4a', fontWeight: '600', lineHeight: 1.35 }}>{a.title}</span>
                        <br />
                        <span style={{ fontSize: '0.73rem', color: '#aaa', fontFamily: 'monospace' }}>{a.slug}</span>
                      </td>
                      <td style={{ ...S.td, textTransform: 'capitalize' }}>{a.category || '—'}</td>
                      <td style={S.td}>
                        <span style={S.badge(a.status)}>{a.status || 'draft'}</span>
                      </td>
                      <td style={S.td} suppressHydrationWarning>{fmt(a.created_at)}</td>
                      <td style={{ ...S.td, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <button onClick={() => setEditing(a)} style={S.btn('default')} disabled={busy || isImproving}>Edit</button>

                          <button
                            onClick={() => improveArticle(a)}
                            style={{ ...S.btn('improve'), minWidth: '4.5rem' }}
                            disabled={busy || isImproving}
                            title="Rewrite with AI to improve quality, add practical sections, and apply SEO internal linking"
                          >
                            {isImproving ? '…' : '✦ Improve'}
                          </button>

                          {a.status !== 'published' && (
                            <button onClick={() => setStatus(a, 'published')} style={S.btn('publish')} disabled={busy || isImproving}>
                              Publish
                            </button>
                          )}
                          {a.status !== 'draft' && (
                            <button onClick={() => setStatus(a, 'draft')} style={S.btn('draft')} disabled={busy || isImproving}>
                              Draft
                            </button>
                          )}
                          {a.status !== 'rejected' && (
                            <button onClick={() => setStatus(a, 'rejected')} style={S.btn('reject')} disabled={busy || isImproving}>
                              Reject
                            </button>
                          )}

                          <button onClick={() => setDeleting(a)} style={S.btn('delete')} disabled={busy || isImproving}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
