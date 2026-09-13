'use client';

import { useState, useEffect, use } from 'react';
import AppShell from '../../components/AppShell';
import Link from 'next/link';

interface ProtocolData {
  id: string;
  name: string;
  category: string;
  chain: string;
  tvl: string;
  tvlRaw: number;
  apy: string;
  volume24h: string;
  dailyRevenue: string;
  schema: string;
  audited: boolean;
  auditFirm: string;
  risk: string;
  securityScore: number;
  description: string;
  subgraphId: string;
  contracts: { name: string; address: string; explorer: string }[];
  sampleQuery: string;
}

export default function ProtocolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const protocolId = resolvedParams.id;

  const [protocol, setProtocol] = useState<ProtocolData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subgraph' | 'security' | 'contracts'>('overview');

  // Live Query State inside protocol detail
  const [query, setQuery] = useState('');
  const [executing, setExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [queryError, setQueryError]   = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/protocols?id=${protocolId}`)
      .then(res => res.json())
      .then(data => {
        if (data.protocol) {
          setProtocol(data.protocol);
          setQuery(data.protocol.sampleQuery || '{\n  _meta {\n    block {\n      number\n    }\n  }\n}');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [protocolId]);

  const handleRunQuery = async () => {
    if (!protocol) return;
    setExecuting(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subgraphId: protocol.subgraphId,
          query,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setQueryError(json.error || 'Failed to execute query');
      } else {
        setQueryResult(JSON.stringify(json.data ?? json, null, 2));
      }
    } catch (err: any) {
      setQueryError(err.message || 'Network error while executing GraphQL query');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
            Loading protocol specs...
          </div>
        </div>
      </AppShell>
    );
  }

  if (!protocol) {
    return (
      <AppShell>
        <div className="page-content">
          <div className="card text-center" style={{ padding: 40 }}>
            <h2 className="card-title" style={{ color: 'var(--red)', marginBottom: 10 }}>Protocol not found</h2>
            <p className="text-sm text-muted" style={{ marginBottom: 20 }}>The protocol identifier "{protocolId}" does not exist in the index.</p>
            <Link href="/protocols" className="btn btn-primary btn-sm">
              ← Return to protocols explorer
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Topbar */}
      <div className="topbar">
        <Link href="/protocols" className="topbar-breadcrumb" style={{ textDecoration: 'none' }}>Protocols</Link>
        <span className="topbar-divider">/</span>
        <span className="topbar-title">{protocol.name}</span>
        <div className="topbar-actions">
          <Link href={`/copilot?protocol=${protocol.id}`} className="btn btn-outline btn-sm">
            Copilot IDE
          </Link>
          <Link href={`/compare?p1=${protocol.id}`} className="btn btn-primary btn-sm">
            Compare
          </Link>
        </div>
      </div>

      <div className="page-content">
        {/* Header Hero */}
        <div className="card mb-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{protocol.name}</h1>
                <span className="text-xs text-muted font-mono">{protocol.category}</span>
                <span className="text-xs text-muted font-mono">{protocol.chain}</span>
                <span className="text-xs text-muted font-mono">{protocol.schema}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 640 }}>
                {protocol.description}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
                <div className="text-xs text-muted">Security score</div>
                <div className="font-mono" style={{ fontSize: 20, fontWeight: 600, color: protocol.securityScore > 90 ? 'var(--color-gold)' : 'var(--amber)' }}>
                  {protocol.securityScore} / 100
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
                <div className="text-xs text-muted">Risk rating</div>
                <div className="font-mono" style={{ fontSize: 20, fontWeight: 600, color: protocol.risk === 'Low' ? 'var(--color-gold)' : 'var(--amber)' }}>
                  {protocol.risk}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Terminal Metrics Strip */}
        <div className="top-metrics-strip mb-6">
          <div className="metric-segment">
            <div className="metric-segment-label">Total value locked (TVL)</div>
            <div className="metric-segment-value">{protocol.tvl}</div>
            <div className="metric-segment-sub">Live from subgraph</div>
          </div>

          <div className="metric-segment">
            <div className="metric-segment-label">Supply APY</div>
            <div className="metric-segment-value" style={{ color: 'var(--color-gold)' }}>{protocol.apy}</div>
            <div className="metric-segment-sub">Weighted average</div>
          </div>

          <div className="metric-segment">
            <div className="metric-segment-label">24h Volume</div>
            <div className="metric-segment-value">{protocol.volume24h}</div>
            <div className="metric-segment-sub">Past 24h</div>
          </div>

          <div className="metric-segment">
            <div className="metric-segment-label">Daily protocol revenue</div>
            <div className="metric-segment-value">{protocol.dailyRevenue}</div>
            <div className="metric-segment-sub">Standardized schema</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <button
            className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('overview')}
          >
            Protocol overview & specs
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'subgraph' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('subgraph')}
          >
            Live subgraph query runner
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('security')}
          >
            Security & audits
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'contracts' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('contracts')}
          >
            Verified contracts
          </button>
        </div>

        {/* TAB 1: Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Messari standardized entity specs</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: 12, border: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--mono)' }}>financialsDailySnapshots</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Tracks totalValueLockedUSD, dailySupplySideRevenueUSD, dailyProtocolSideRevenueUSD.</div>
                </div>

                <div style={{ padding: 12, border: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>marketDailySnapshots</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Tracks market-level TVL, rates, cumulative deposit/borrow volumes.</div>
                </div>

                <div style={{ padding: 12, border: '1px solid var(--border)', background: 'var(--bg-base)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}>liquidityPoolDailySnapshots</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Tracks pool token reserves, daily volume USD, and fee APYs.</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Deployment metadata</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <span className="text-muted">Subgraph deployment ID</span>
                  <span className="font-mono">{protocol.subgraphId.slice(0, 10)}...{protocol.subgraphId.slice(-6)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <span className="text-muted">Primary chain</span>
                  <span className="text-muted">{protocol.chain}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <span className="text-muted">Audit verification</span>
                  <span style={{ color: 'var(--color-gold)' }}>Verified clean ({protocol.auditFirm})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <span className="text-muted">Schema version</span>
                  <span className="font-mono" style={{ color: 'var(--accent)' }}>v3.0.1 Standardized</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <Link href={`/copilot?protocol=${protocol.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  Open in Copilot IDE
                </Link>
                <Link href={`/yield-calculator`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                  Compute yield
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Live Query Runner */}
        {activeTab === 'subgraph' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Live subgraph query runner</div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRunQuery}
                disabled={executing}
              >
                {executing ? 'Executing...' : 'Execute query'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div className="text-xs text-muted font-mono mb-2">GRAPHQL QUERY EDITOR</div>
                <textarea
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: 260,
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    padding: 12,
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    color: 'var(--accent)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <div className="text-xs text-muted font-mono mb-2">RESPONSE JSON</div>
                <pre
                  style={{
                    width: '100%',
                    height: 260,
                    overflow: 'auto',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    padding: 12,
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    color: queryError ? 'var(--red)' : queryResult ? 'var(--color-gold)' : 'var(--text-muted)',
                  }}
                >
                  {queryError ? `// ERROR\n${queryError}` : queryResult ? queryResult : '// Click "Execute query" to fetch live data'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Security */}
        {activeTab === 'security' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">Security scorecard</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Smart contract immutability & upgradeability</span>
                    <span className="font-mono" style={{ color: 'var(--color-gold)' }}>98 / 100</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                    <div style={{ width: '98%', height: '100%', background: 'var(--color-gold)' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Oracle & price feed security (Chainlink integration)</span>
                    <span className="font-mono" style={{ color: 'var(--color-rust)' }}>95 / 100</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                    <div style={{ width: '95%', height: '100%', background: 'var(--color-rust)' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Liquidity & slippage depth resilience</span>
                    <span className="font-mono" style={{ color: 'var(--accent)' }}>91 / 100</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                    <div style={{ width: '91%', height: '100%', background: 'var(--accent)' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Auditing history</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{protocol.auditFirm}</div>
                <div style={{ fontSize: 12, color: 'var(--color-gold)', marginTop: 2 }}>✓ Zero critical/high severity issues outstanding</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Contracts */}
        {activeTab === 'contracts' && (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract name</th>
                  <th>Contract address</th>
                  <th style={{ textAlign: 'right' }}>Explorer</th>
                </tr>
              </thead>
              <tbody>
                {protocol.contracts.map((c, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>{c.address}</td>
                    <td style={{ textAlign: 'right' }}>
                      <a href={c.explorer} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                        Etherscan ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
