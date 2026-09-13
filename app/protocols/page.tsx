'use client';

import { useState } from 'react';
import AppShell from '../components/AppShell';
import Link from 'next/link';

const PROTOCOLS = [
  {
    id: 'aave-v3',
    name: 'Aave v3',
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

export default function ProtocolsPage() {
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('All');
  const [sortBy,    setSortBy]    = useState('TVL');

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
          <Link href="/compare" className="btn btn-primary btn-sm">
            Compare protocols
          </Link>
        </div>
      </div>

      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Protocol explorer</h1>
          <p className="page-subtitle">Browse and analyze DeFi protocols connected to The Graph standardized subgraphs.</p>
        </div>

        {/* Financial Terminal Metrics Strip */}
        <div className="top-metrics-strip">
          <div className="metric-segment">
            <div className="metric-segment-label">Total protocols</div>
            <div className="metric-segment-value">{PROTOCOLS.length}</div>
          </div>
          <div className="metric-segment">
            <div className="metric-segment-label">Messari schema</div>
            <div className="metric-segment-value">{PROTOCOLS.filter(p => p.schema === 'Messari').length}</div>
          </div>
          <div className="metric-segment">
            <div className="metric-segment-label">Lending protocols</div>
            <div className="metric-segment-value">{PROTOCOLS.filter(p => p.category === 'Lending').length}</div>
          </div>
          <div className="metric-segment">
            <div className="metric-segment-label">DEX protocols</div>
            <div className="metric-segment-value">{PROTOCOLS.filter(p => p.category === 'DEX').length}</div>
          </div>
        </div>

        {/* Filter + Search Bar */}
        <div className="card mb-4" style={{ padding: 14 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="console-input"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '6px 12px', minWidth: 220 }}
              placeholder="Search protocols..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 6 }}>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="text-xs text-muted">Sort by:</span>
              {SORT_OPTIONS.map(s => (
                <button
                  key={s}
                  className={`btn btn-sm ${sortBy === s ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={() => setSortBy(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Table View ── */}
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Protocol</th>
                <th>Category</th>
                <th>Chain</th>
                <th style={{ textAlign: 'right' }}>TVL</th>
                <th style={{ textAlign: 'right' }}>Avg APY</th>
                <th style={{ textAlign: 'right' }}>24h Volume</th>
                <th style={{ textAlign: 'right' }}>24h Change</th>
                <th>Schema</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} id={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Link href={`/protocols/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {p.name}
                    </Link>
                  </td>
                  <td className="text-muted">{p.category}</td>
                  <td className="text-muted">{p.chain}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.tvl}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--severity-none)' }}>
                    {p.apy}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>
                    {p.volume24h}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>
                    <span style={{ color: p.changeDir === 'up' ? 'var(--severity-none)' : 'var(--severity-high)' }}>
                      {p.changeDir === 'up' ? '▲' : '▼'} {p.change24h}
                    </span>
                  </td>
                  <td className="text-muted text-xs font-mono">{p.schema}</td>
                  <td>
                    <span className="status-indicator">
                      <span className="status-dot online" />
                      <span className="text-sm">clean</span>
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <Link href={`/protocols/${p.id}`} className="btn btn-outline btn-sm" style={{ padding: '3px 8px', fontSize: 11 }}>
                        Details →
                      </Link>
                      <Link href={`/copilot?protocol=${p.id}`} className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', fontSize: 11 }}>
                        Query ⚡
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="card text-center" style={{ padding: 40 }}>
              <div className="text-muted text-sm">No protocols match your search query.</div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
