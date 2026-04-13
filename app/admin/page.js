'use client';

import { useState } from 'react';
import Link from 'next/link';
import Dashboard     from './_components/Dashboard.js';
import Generator     from './_components/Generator.js';
import BulkGenerator from './_components/BulkGenerator.js';
import Topics        from './_components/Topics.js';
import Articles      from './_components/Articles.js';

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'articles',  label: '📄 Articles' },
  { id: 'generate',  label: '✦ Generate' },
  { id: 'bulk',      label: '⚡ Bulk Generate' },
  { id: 'topics',    label: '🗂 Topics' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSaved() { setRefreshKey(k => k + 1); }

  return (
    <div style={{ minHeight:'100vh', background:'#faf7f2', fontFamily:'Georgia, serif' }}>
      {/* Header */}
      <div style={{ background:'#1e2d4a', color:'white', padding:'0 1.5rem' }}>
        <div style={{ maxWidth:'72rem', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'1.25rem', paddingBottom:'0' }}>
          <div>
            <Link href="/" style={{ color:'#d4a017', textDecoration:'none', fontSize:'0.8rem' }}>← Back to site</Link>
            <h1 style={{ margin:'0.25rem 0 0', fontSize:'1.5rem', fontWeight:'bold' }}>Bible Explorer Admin</h1>
            <p style={{ margin:'0.2rem 0 0', color:'#a8b8cc', fontSize:'0.85rem' }}>Content Management & SEO Generator</p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ maxWidth:'72rem', margin:'0 auto', display:'flex', gap:'0', marginTop:'1.25rem' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background:    activeTab === tab.id ? '#faf7f2' : 'transparent',
                color:         activeTab === tab.id ? '#1e2d4a' : '#a8b8cc',
                border:        'none',
                borderRadius:  '0.5rem 0.5rem 0 0',
                padding:       '0.65rem 1.25rem',
                fontSize:      '0.875rem',
                fontWeight:    activeTab === tab.id ? '700' : '400',
                cursor:        'pointer',
                fontFamily:    'inherit',
                transition:    'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:'72rem', margin:'0 auto', padding:'2rem 1.5rem' }}>
        {activeTab === 'dashboard' && <Dashboard key={refreshKey} />}
        {activeTab === 'articles'  && <Articles key={refreshKey} />}
        {activeTab === 'generate'  && <Generator  onSaved={handleSaved} />}
        {activeTab === 'bulk'      && <BulkGenerator onSaved={handleSaved} />}
        {activeTab === 'topics'    && <Topics />}
      </div>
    </div>
  );
}
