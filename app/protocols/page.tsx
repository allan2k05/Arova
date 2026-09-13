'use client';

import { useState } from 'react';
import AppShell from '../components/AppShell';
import Link from 'next/link';

const PROTOCOLS = [
  {
    id: 'aave-v3',
    name: 'Aave v3',
    icon: '⚡',
    color: '#B6509E',
    category: 'Lending',
    chain: 'Ethereum',
    tvl: '$11.8B',
    apy: '4.2%',
    volume24h: '$842M',
    change24h: '+2.3%',
    changeDir: 'up',
    schema: 'Messari',
    audited: true,
    risk: 'Low',
    description: 'Decentralized non-custodial liquidity protocol where users can supply assets as collateral and borrow.',
    subgraphId: 'JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk',
  },
  {
    id: 'compound-v3',
    name: 'Compound v3',
    icon: '🏛️',
    color: '#00D395',
    category: 'Lending',
    chain: 'Ethereum',
    tvl: '$2.4B',
    apy: '3.8%',
    volume24h: '$211M',
    change24h: '-0.5%',
    changeDir: 'down',
    schema: 'Messari',
    audited: true,
    risk: 'Low',
    description: 'Algorithmic, autonomous interest rate protocol allowing users to supply and borrow crypto assets.',
    subgraphId: 'AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9',
  },
  {
    id: 'uniswap-v3',
    name: 'Uniswap v3',
    icon: '🦄',
    color: '#FF007A',
    category: 'DEX',
    chain: 'Ethereum',
    tvl: '$4.9B',
    apy: '12.4%',
    volume24h: '$1.2B',
    change24h: '+5.7%',
    changeDir: 'up',
    schema: 'Official',
    audited: true,
    risk: 'Medium',
    description: 'Concentrated liquidity AMM enabling capital-efficient trading with customizable fee tiers.',
    subgraphId: '5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV',
  },
  {
    id: 'balancer-v2',
    name: 'Balancer v2',
    icon: '⚖️',
    color: '#1982FF',
    category: 'DEX',
    chain: 'Ethereum',
    tvl: '$1.1B',
    apy: '8.1%',
    volume24h: '$98M',
    change24h: '+1.1%',
    changeDir: 'up',
    schema: 'Messari',
    audited: true,
    risk: 'Medium',
    description: 'Automated portfolio manager and liquidity provider with multi-token weighted pools.',
    subgraphId: '794H6CNzdGF5YfBK9nPsUgGn7EBbdJSCTjgcKPEPyFnn',
  },
];

const CATEGORIES = ['All', 'Lending', 'DEX'];
const SORT_OPTIONS = ['TVL', 'APY', '24h Volume'];

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = { Low: 'badge-green', Medium: 'badge-amber', High: 'badge-red' };
  return <span className={`badge ${map[risk] ?? 'badge-neutral'}`}>{risk} Risk</span>;
}

export default function ProtocolsPage() {
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('All');
  const [sortBy,    setSortBy]    = useState('TVL');
  const [view,      setView]      = useState<'grid' | 'table'>('table');

  const parseTvl = (s: string) => parseFloat(s.replace(/[$BM]/g, '')) * (s.includes('B') ? 1e9 : 1e6);
  const parseApy = (s: string) => parseFloat(s);
  const parseVol = (s: string) => parseFloat(s.replace(/[$BM]/g, '')) * (s.includes('B') ? 1e9 : 1e6);

  const filtered = PROTOCOLS
    .filter(p =>
      (category === 'All' || p.category === category) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.chain.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'TVL')        return parseTvl(b.tvl) - parseTvl(a.tvl);
      if (sortBy === 'APY')        return parseApy(b.apy) - parseApy(a.apy);
      if (sortBy === '24h Volume') return parseVol(b.volume24h) - parseVol(a.volume24h);
      return 0;
    });

  return (
    <AppShell>
      {/* Topbar */}
      <div className="topbar">
        <span className="topbar-breadcrumb">Explore</span>
        <span className="topbar-divider">/</span>
        <span className="topbar-title">Protocols</span>
        <div className="topbar-actions">
          <button
            className={`btn btn-ghost btn-sm btn-icon`}
            title="Table view"
            onClick={() => setView('table')}
            style={{ color: view === 'table' ? 'var(--accent-bright)' : undefined }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <button
            className={`btn btn-ghost btn-sm btn-icon`}
            title="Grid view"
            onClick={() => setView('grid')}
            style={{ color: view === 'grid' ? 'var(--accent-bright)' : undefined }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </button>
          <Link href="/compare" className="btn btn-primary btn-sm">
            Compare Protocols
          </Link>
        </div>
      </div>

      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Protocol Explorer</h1>
          <p className="page-subtitle">Browse and analyze DeFi protocols connected to The Graph standardized subgraphs.</p>
        </div>

        {/* Stats Row */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', marginBottom: 20 }}>
          <div className="stat-card accent-blue">
            <div className="stat-label">Total Protocols</div>
            <div className="stat-value blue">{PROTOCOLS.length}</div>
          </div>
          <div className="stat-card accent-green">
            <div className="stat-label">Messari Schema</div>
            <div className="stat-value green">{PROTOCOLS.filter(p => p.schema === 'Messari').length}</div>
          </div>
          <div className="stat-card accent-purple">
            <div className="stat-label">Lending</div>
            <div className="stat-value purple">{PROTOCOLS.filter(p => p.category === 'Lending').length}</div>
          </div>
          <div className="stat-card accent-cyan">
            <div className="stat-label">DEX</div>
            <div className="stat-value cyan">{PROTOCOLS.filter(p => p.category === 'DEX').length}</div>
          </div>
        </div>

        {/* Filter + Search Bar */}
        <div className="filter-bar">
          <div className="search-wrap">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className="search-input"
              placeholder="Search protocols..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`filter-btn${category === c ? ' active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="text-xs text-muted">Sort:</span>
            {SORT_OPTIONS.map(s => (
              <button
                key={s}
                className={`filter-btn${sortBy === s ? ' active' : ''}`}
                onClick={() => setSortBy(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table View ── */}
        {view === 'table' ? (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Protocol</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>TVL</th>
                  <th style={{ textAlign: 'right' }}>Avg APY</th>
                  <th style={{ textAlign: 'right' }}>24h Volume</th>
                  <th style={{ textAlign: 'right' }}>24h Δ</th>
                  <th>Schema</th>
                  <th>Risk</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} id={p.id}>
                    <td>
                      <div className="protocol-cell">
                        <div className="protocol-icon" style={{ background: `${p.color}18`, borderColor: `${p.color}35` }}>
                          {p.icon}
                        </div>
                        <div>
                          <div className="protocol-name">{p.name}</div>
                          <div className="protocol-chain">{p.chain}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.category === 'Lending' ? 'badge-purple' : 'badge-cyan'}`}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {p.tvl}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--green)' }}>
                      {p.apy}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>
                      {p.volume24h}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`stat-change ${p.changeDir === 'up' ? 'up' : 'down'}`}>
                        {p.changeDir === 'up' ? '▲' : '▼'} {p.change24h}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.schema === 'Messari' ? 'badge-blue' : 'badge-neutral'}`}>
                        {p.schema}
                      </span>
                    </td>
                    <td><RiskBadge risk={p.risk} /></td>
                    <td>
                      <Link href={`/copilot?protocol=${p.id}`} className="btn btn-ghost btn-sm">
                        Query →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-title">No protocols match</div>
                <div className="empty-state-desc">Try adjusting your search or category filter.</div>
              </div>
            )}
          </div>
        ) : (
          /* ── Grid View ── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
            {filtered.map(p => (
              <div key={p.id} id={p.id} className="card card-interactive" style={{ padding: 20 }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="protocol-icon" style={{ background: `${p.color}18`, borderColor: `${p.color}35`, width: 40, height: 40, fontSize: 19, borderRadius: 10 }}>
                      {p.icon}
                    </div>
                    <div>
                      <div className="protocol-name" style={{ fontSize: 14 }}>{p.name}</div>
                      <div className="protocol-chain">{p.chain}</div>
                    </div>
                  </div>
                  <RiskBadge risk={p.risk} />
                </div>

                <p style={{ fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.55, marginBottom: 16 }}>
                  {p.description}
                </p>

                <div className="grid-2" style={{ marginBottom: 14 }}>
                  <div className="metric-chip">
                    <div className="metric-chip-label">TVL</div>
                    <div className="metric-chip-val" style={{ fontSize: 16 }}>{p.tvl}</div>
                  </div>
                  <div className="metric-chip">
                    <div className="metric-chip-label">Avg APY</div>
                    <div className="metric-chip-val" style={{ fontSize: 16, color: 'var(--green)' }}>{p.apy}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className={`badge ${p.category === 'Lending' ? 'badge-purple' : 'badge-cyan'}`}>{p.category}</span>
                    <span className={`badge ${p.schema === 'Messari' ? 'badge-blue' : 'badge-neutral'}`}>{p.schema}</span>
                  </div>
                  <Link href={`/copilot?protocol=${p.id}`} className="btn btn-ghost btn-sm">
                    Query →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
