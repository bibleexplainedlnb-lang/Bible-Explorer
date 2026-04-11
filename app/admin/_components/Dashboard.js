'use client';

import { useState, useEffect, useCallback } from 'react';

const S = {
  card:    { background: '#fff', border: '1px solid #e8dfc8', borderRadius: '0.875rem', padding: '1.5rem' },
  label:   { fontSize: '0.72rem', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.25rem' },
  badge:   (s) => ({ display:'inline-block', padding:'0.2rem 0.65rem', borderRadius:'1rem', fontSize:'0.75rem', fontWeight:'600',
    background: s==='published' ? '#dcf5e7' : '#fff3cd', color: s==='published' ? '#1b5e20' : '#856404' }),
  th:      { padding: '0.6rem 1rem', fontSize:'0.8rem', fontWeight:'600', color:'#6b6b6b', textAlign:'left', borderBottom:'1px solid #e8dfc8' },
  td:      { padding: '0.65rem 1rem', fontSize:'0.875rem', color:'#2a2a2a', borderBottom:'1px solid #f5f0e8' },
  btn:     { padding:'0.35rem 0.9rem', border:'1px solid #e8dfc8', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer', background:'white', color:'#1e2d4a', fontFamily:'inherit' },
  btnDanger:{ padding:'0.35rem 0.9rem', border:'1px solid #f5c6c6', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer', background:'#fff0f0', color:'#7b2020', fontFamily:'inherit' },
};

export default function Dashboard() {
  const [stats,    setStats]    = useState(null);
  const [articles, setArticles] = useState([]);
  const [filter,   setFilter]   = useState({ status: '', category: '' });
  const [loading,  setLoading]  = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status)   params.set('status',   filter.status);
      if (filter.category) params.set('category', filter.category);

      const [statsRes, articlesRes] = await Promise.all([
        fetch(`/api/admin/stats?${params}`),
        fetch(`/api/admin/articles?${params}`),
      ]);

      const s = statsRes.ok   ? await statsRes.json()   : {};
      const a = articlesRes.ok ? await articlesRes.json() : [];

      setStats(s);
      setArticles(Array.isArray(a) ? a : []);
    } catch (err) {
      console.error('[Dashboard] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function toggleStatus(article) {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    await fetch(`/api/admin/articles/${article.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    loadData();
  }

  async function deleteArticle(id) {
    if (!confirm('Delete this article?')) return;
    await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
    loadData();
  }

  const statCards = [
    { label: 'Topics',    value: stats?.totalTopics,   color: '#2c4270' },
    { label: 'Articles',  value: stats?.totalArticles, color: '#1e2d4a' },
    { label: 'Drafts',    value: stats?.drafts,        color: '#b8860b' },
    { label: 'Published', value: stats?.published,     color: '#2d6a4f' },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
        {statCards.map(c => (
          <div key={c.label} style={S.card}>
            <p style={{ ...S.label, margin:'0 0 0.4rem' }}>{c.label}</p>
            <p style={{ margin:0, fontSize:'2rem', fontWeight:'bold', color: c.color }}>
              {loading ? '—' : (c.value ?? 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:'0.9rem', color:'#6b6b6b', fontWeight:'600' }}>Articles</span>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          style={{ padding:'0.4rem 0.75rem', border:'1px solid #d4c5a9', borderRadius:'0.5rem', fontSize:'0.85rem', fontFamily:'inherit' }}>
          <option value="">All status</option>
          <option value="draft">Drafts</option>
          <option value="published">Published</option>
        </select>
        <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          style={{ padding:'0.4rem 0.75rem', border:'1px solid #d4c5a9', borderRadius:'0.5rem', fontSize:'0.85rem', fontFamily:'inherit' }}>
          <option value="">All categories</option>
          <option value="questions">Questions</option>
          <option value="guides">Guides</option>
          <option value="topics">Topics</option>
        </select>
        <button onClick={loadData} style={S.btn}>↻ Refresh</button>
      </div>

      {/* Articles table */}
      <div style={{ ...S.card, padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'#8b7355' }}>Loading…</div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'#8b7355' }}>No articles found. Generate some!</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead style={{ background:'#f9f5ee' }}>
                <tr>
                  <th style={S.th}>Title</th>
                  <th style={S.th}>Category</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Created</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(a => (
                  <tr key={a.id}>
                    <td style={S.td}>
                      <span style={{ color:'#1e2d4a', fontWeight:'500' }}>{a.title}</span>
                      <br />
                      <span style={{ fontSize:'0.75rem', color:'#aaa', fontFamily:'monospace' }}>{a.slug}</span>
                    </td>
                    <td style={S.td}>{a.category || '—'}</td>
                    <td style={S.td}><span style={S.badge(a.status)}>{a.status}</span></td>
                    <td style={S.td} suppressHydrationWarning>{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                    <td style={{ ...S.td, whiteSpace:'nowrap' }}>
                      <button onClick={() => toggleStatus(a)} style={{ ...S.btn, marginRight:'0.4rem' }}>
                        {a.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => deleteArticle(a.id)} style={S.btnDanger}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
