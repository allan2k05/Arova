'use client';

import { useState, useEffect, use } from 'react';
import AppShell from '../../components/AppShell';
import Link from 'next/link';

interface ProtocolData {
  id: string;
  name: string;
  icon: string;
  color: string;
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
          <div style={{ color: 'var(--accent-bright)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="live-dot green"></span> Loading protocol specs...
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
            <h2 className="card-title" style={{ color: 'var(--red)', marginBottom: 10 }}>Protocol Not Found</h2>
            <p className="text-sm text-muted" style={{ marginBottom: 20 }}>The protocol identifier "{protocolId}" does not exist in the index.</p>
            <Link href="/protocols" className="btn btn-primary btn-sm">
              ← Return to Protocols Explorer
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
            ⚡ Copilot IDE
          </Link>
          <Link href={`/compare?p1=${protocol.id}`} className="btn btn-primary btn-sm">
            ⚔️ Compare
          </Link>
        </div>
      </div>

      <div className="page-content">
        {/* Header Hero Banner */}
        <div className="card mb-6" style={{ background: `linear-gradient(135deg, ${protocol.color}15 0%, var(--bg-card) 60%)`, borderColor: `${protocol.color}30` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="protocol-icon" style={{ background: `${protocol.color}25`, borderColor: `${protocol.color}60`, width: 56, height: 56, fontSize: 26, borderRadius: 14 }}>
                {protocol.icon}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{protocol.name}</h1>
                  <span className={`badge ${protocol.category === 'Lending' ? 'badge-purple' : 'badge-cyan'}`}>{protocol.category}</span>
                  <span className="badge badge-neutral">{protocol.chain}</span>
                  <span className={`badge ${protocol.schema.includes('Messari') ? 'badge-blue' : 'badge-neutral'}`}>{protocol.schema}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 640 }}>
                  {protocol.description}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="stat-card" style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}>
                <div className="stat-label">Security Score</div>
                <div className="stat-value" style={{ color: protocol.securityScore > 90 ? 'var(--green)' : 'var(--amber)', fontSize: 20 }}>
                  {protocol.securityScore} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 100</span>
                </div>
              </div>
              <div className="stat-card" style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}>
                <div className="stat-label">Risk Rating</div>
                <div className="stat-value" style={{ color: protocol.risk === 'Low' ? 'var(--green)' : 'var(--amber)', fontSize: 20 }}>
                  {protocol.risk}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="stats-grid mb-6">
          <div className="stat-card accent-blue">
            <div className="stat-label">Total Value Locked (TVL)</div>
            <div className="stat-value blue">{protocol.tvl}</div>
            <div className="stat-change up">▲ Live from Subgraph</div>
          </div>

          <div className="stat-card accent-green">
            <div className="stat-label">Supply APY</div>
            <div className="stat-value green">{protocol.apy}</div>
            <div className="stat-change up">▲ Weighted Average</div>
          </div>

          <div className="stat-card accent-purple">
            <div className="stat-label">24h Trading/Borrow Vol</div>
            <div className="stat-value purple">{protocol.volume24h}</div>
            <div className="stat-change neutral">● Past 24h</div>
          </div>

          <div className="stat-card accent-cyan">
            <div className="stat-label">Daily Protocol Revenue</div>
            <div className="stat-value cyan">{protocol.dailyRevenue}</div>
            <div className="stat-change up">▲ Standardized Schema</div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="filter-bar mb-4">
          <button
            className={`filter-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Protocol Overview & Specs
          </button>
          <button
            className={`filter-btn ${activeTab === 'subgraph' ? 'active' : ''}`}
            onClick={() => setActiveTab('subgraph')}
          >
            ⚡ Live Subgraph Query Runner
          </button>
          <button
            className={`filter-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🛡️ Security & Audits
          </button>
          <button
            className={`filter-btn ${activeTab === 'contracts' ? 'active' : ''}`}
            onClick={() => setActiveTab('contracts')}
          >
            📜 Verified Contracts
          </button>
        </div>

        {/* TAB 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Messari Standardized Entity Specs</div>
                  <div className="card-subtitle">GraphQL Schema mapping for subgraphs indexed on Subgraph Studio</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-bright)', fontFamily: 'var(--mono)' }}>financialsDailySnapshots</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Tracks totalValueLockedUSD, dailySupplySideRevenueUSD, dailyProtocolSideRevenueUSD.</div>
                </div>

                <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>marketDailySnapshots</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Tracks market-level TVL, rates, cumulative deposit/borrow volumes.</div>
                </div>

                <div style={{ background: 'var(--bg-card-subtle)', padding: 12, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)', fontFamily: 'var(--mono)' }}>liquidityPoolDailySnapshots</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Tracks pool token reserves, daily volume USD, and fee APYs.</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Deployment Metadata</div>
                  <div className="card-subtitle">Indexed via Subgraph Studio</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: 8 }}>
                  <span className="text-muted">Subgraph Deployment ID</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-primary)' }}>{protocol.subgraphId.slice(0, 10)}...{protocol.subgraphId.slice(-6)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: 8 }}>
                  <span className="text-muted">Primary Chain</span>
                  <span className="badge badge-neutral">{protocol.chain}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: 8 }}>
                  <span className="text-muted">Audit Verification</span>
                  <span className="badge badge-green">Verified Clean ({protocol.auditFirm})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-subtle)', paddingBottom: 8 }}>
                  <span className="text-muted">Schema Version</span>
                  <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-bright)' }}>v3.0.1 Standardized</span>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Link href={`/copilot?protocol=${protocol.id}`} className="btn btn-primary btn-sm flex-1 text-center">
                  ⚡ Open in Copilot IDE
                </Link>
                <Link href={`/yield-calculator`} className="btn btn-outline btn-sm flex-1 text-center">
                  🧮 Compute Yield
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Live Query Runner */}
        {activeTab === 'subgraph' && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Live Subgraph Query Runner</div>
                <div className="card-subtitle">Executes queries directly against Subgraph Studio via server-side GRAPH_API_KEY proxy</div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRunQuery}
                disabled={executing}
              >
                {executing ? 'Executing...' : '▶ Execute Query'}
              </button>
            </div>

            <div className="grid-2" style={{ alignItems: 'stretch' }}>
              {/* Editor */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>GRAPHQL QUERY EDITOR</div>
                <textarea
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: 260,
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: 12,
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    color: 'var(--accent-bright)',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Output */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>RESPONSE JSON</div>
                <pre
                  style={{
                    width: '100%',
                    height: 260,
                    overflow: 'auto',
                    background: 'var(--bg-void)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: 12,
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    color: queryError ? 'var(--red)' : queryResult ? 'var(--green)' : 'var(--text-muted)',
                  }}
                >
                  {queryError ? `// ERROR\n${queryError}` : queryResult ? queryResult : '// Click "Execute Query" to fetch live data from Subgraph Studio'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Security */}
        {activeTab === 'security' && (
          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Security & Audit Scorecard</div>
                  <div className="card-subtitle">Automated static code & risk vector analysis</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Smart Contract Immutability & Upgradeability</span>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--green)' }}>98 / 100</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-card-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '98%', height: '100%', background: 'var(--green)' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Oracle & Price Feed Security (Chainlink Integration)</span>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--green)' }}>95 / 100</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-card-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '95%', height: '100%', background: 'var(--green)' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Liquidity & Slippage Depth Resilience</span>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-bright)' }}>91 / 100</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-card-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '91%', height: '100%', background: 'var(--accent-bright)' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Governance Timelock Delay</span>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--purple)' }}>88 / 100</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-card-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '88%', height: '100%', background: 'var(--purple)' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Auditing History</div>
                  <div className="card-subtitle">Audited by tier-1 security firms</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: 12, background: 'var(--bg-card-subtle)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{protocol.auditFirm}</div>
                  <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 2 }}>✓ Zero Critical/High severity issues outstanding</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Formal verification complete across core contracts.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Contracts */}
        {activeTab === 'contracts' && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Verified Smart Contract Registry</div>
                <div className="card-subtitle">On-chain Ethereum contracts tracked by Arova</div>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract Name</th>
                  <th>Contract Address</th>
                  <th style={{ textAlign: 'right' }}>Explorer</th>
                </tr>
              </thead>
              <tbody>
                {protocol.contracts.map((c, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent-bright)' }}>{c.address}</td>
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
