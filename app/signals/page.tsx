'use client';

import { useState } from 'react';
import AppShell from '../components/AppShell';

type Severity = 'HIGH' | 'MEDIUM' | 'INFO';
type Category = 'Security' | 'Liquidity' | 'Market' | 'Smart Contract';

interface Signal {
  id: string;
  severity: Severity;
  category: Category;
  protocol: string;
  protocolIcon: string;
  title: string;
  description: string;
  detectedAt: string;
  chain: string;
  metrics: { label: string; value: string; change?: string; dir?: 'up' | 'down' }[];
  recommendation: string;
}

const STATIC_SIGNALS: Signal[] = [
  {
    id: 's1',
    severity: 'HIGH',
    category: 'Liquidity',
    protocol: 'Aave v3',
    protocolIcon: '⚡',
    title: 'Unusual TVL Drop Detected',
    description: 'Total Value Locked dropped more than 12% over the last 24 hours — threshold breached.',
    detectedAt: '2h ago',
    chain: 'Ethereum',
    metrics: [
      { label: 'Current TVL', value: '$10.4B', change: '-12.4%', dir: 'down' },
      { label: 'Prior 24h TVL', value: '$11.8B' },
      { label: 'Borrow Util.', value: '71.2%', change: '+4.1%', dir: 'up' },
    ],
    recommendation: 'Monitor collateral health ratios and watch for cascading liquidations. Consider reducing position exposure until TVL stabilizes.',
  },
  {
    id: 's2',
    severity: 'HIGH',
    category: 'Security',
    protocol: 'Uniswap v3',
    protocolIcon: '🦄',
    title: 'Flash Loan Volume Spike',
    description: 'Flash loan volume is 8.3x the 7-day average — possible price manipulation or arbitrage event.',
    detectedAt: '45m ago',
    chain: 'Ethereum',
    metrics: [
      { label: 'Flash Loan Vol', value: '$2.1B', change: '+726%', dir: 'up' },
      { label: '7d Avg Flash Vol', value: '$254M' },
      { label: '24h Fees', value: '$8.4M', change: '+312%', dir: 'up' },
    ],
    recommendation: 'Review oracle price feeds for any manipulation. Check if protocol-owned liquidity pools were targeted.',
  },
  {
    id: 's3',
    severity: 'MEDIUM',
    category: 'Market',
    protocol: 'Compound v3',
    protocolIcon: '🏛️',
    title: 'Supply APY Compression',
    description: 'USDC supply APY compressed 42% over 48 hours, potentially indicating low demand from borrowers.',
    detectedAt: '6h ago',
    chain: 'Ethereum',
    metrics: [
      { label: 'Current APY', value: '2.1%', change: '-42%', dir: 'down' },
      { label: 'Prior APY', value: '3.6%' },
      { label: 'Utilization', value: '58.4%', change: '-8.2%', dir: 'down' },
    ],
    recommendation: 'Low utilization is compressing supply rates. Watch for LP withdrawal if rates remain depressed.',
  },
  {
    id: 's4',
    severity: 'MEDIUM',
    category: 'Liquidity',
    protocol: 'Balancer v2',
    protocolIcon: '⚖️',
    title: 'Pool Imbalance Detected',
    description: 'The WETH/USDC/DAI pool weights deviated more than 15% from target, suggesting large directional trade.',
    detectedAt: '3h ago',
    chain: 'Ethereum',
    metrics: [
      { label: 'WETH Weight', value: '38.2%', change: '-11.8%', dir: 'down' },
      { label: 'Target Weight', value: '50%' },
      { label: 'Pool TVL', value: '$84M', change: '-7.3%', dir: 'down' },
    ],
    recommendation: 'Pool rebalancing arbitrage is likely ongoing. Monitor for sustained impermanent loss exposure.',
  },
  {
    id: 's5',
    severity: 'INFO',
    category: 'Smart Contract',
    protocol: 'Aave v3',
    protocolIcon: '⚡',
    title: 'Reserve Factor Updated',
    description: 'Governance proposal passed — WBTC reserve factor increased from 20% to 25%.',
    detectedAt: '12h ago',
    chain: 'Ethereum',
    metrics: [
      { label: 'New Reserve Factor', value: '25%', change: '+5%', dir: 'up' },
      { label: 'Prior Reserve Factor', value: '20%' },
    ],
    recommendation: 'Supply APY for WBTC will decrease slightly. Existing suppliers should review their expected yield.',
  },
];

const SEV_ORDER: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, INFO: 2 };

export default function SignalsPage() {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | Severity>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = STATIC_SIGNALS
    .filter(s =>
      (severityFilter === 'ALL' || s.severity === severityFilter) &&
      (categoryFilter === 'All' || s.category === categoryFilter)
    )
    .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

  const highCount   = STATIC_SIGNALS.filter(s => s.severity === 'HIGH').length;
  const medCount    = STATIC_SIGNALS.filter(s => s.severity === 'MEDIUM').length;
  const infoCount   = STATIC_SIGNALS.filter(s => s.severity === 'INFO').length;

  const sevColor = (s: Severity) =>
    s === 'HIGH' ? 'var(--red)' : s === 'MEDIUM' ? 'var(--amber)' : 'var(--green)';

  const catLabel = ['All', 'Security', 'Liquidity', 'Market', 'Smart Contract'] as const;

  return (
    <AppShell>
      <div className="topbar">
        <span className="topbar-breadcrumb">Explore</span>
        <span className="topbar-divider">/</span>
        <span className="topbar-title">Risk Signals</span>
        <div className="topbar-actions">
          <span className="badge badge-red">{highCount} HIGH</span>
          <span className="badge badge-amber">{medCount} MED</span>
          <span className="badge badge-green">{infoCount} INFO</span>
        </div>
      </div>

      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Risk & Security Signals</h1>
          <p className="page-subtitle">
            Real-time anomaly detection across monitored DeFi protocols via The Graph subgraph analytics.
          </p>
        </div>

        {/* Summary cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', marginBottom: 24 }}>
          <div className="stat-card accent-red">
            <div className="stat-label">High Severity</div>
            <div className="stat-value red">{highCount}</div>
            <div className="stat-sub">Immediate attention</div>
          </div>
          <div className="stat-card accent-amber">
            <div className="stat-label">Medium Severity</div>
            <div className="stat-value amber">{medCount}</div>
            <div className="stat-sub">Monitor closely</div>
          </div>
          <div className="stat-card accent-green">
            <div className="stat-label">Informational</div>
            <div className="stat-value green">{infoCount}</div>
            <div className="stat-sub">Awareness</div>
          </div>
          <div className="stat-card accent-blue">
            <div className="stat-label">Protocols Monitored</div>
            <div className="stat-value blue">4</div>
            <div className="stat-sub">Updated live</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          {(['ALL', 'HIGH', 'MEDIUM', 'INFO'] as const).map(s => (
            <button
              key={s}
              className={`filter-btn${severityFilter === s ? ' active' : ''}`}
              onClick={() => setSeverityFilter(s)}
            >
              {s === 'ALL' ? `All (${STATIC_SIGNALS.length})` : s}
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

          {catLabel.map(c => (
            <button
              key={c}
              className={`filter-btn${categoryFilter === c ? ' active' : ''}`}
              onClick={() => setCategoryFilter(c as typeof categoryFilter)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Signal list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(sig => {
            const isOpen = expanded === sig.id;
            return (
              <div
                key={sig.id}
                className={`signal-card sev-${sig.severity}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setExpanded(isOpen ? null : sig.id)}
              >
                <div className="signal-top">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 15 }}>{sig.protocolIcon}</span>
                      <span className="badge badge-neutral">{sig.protocol}</span>
                      <span className={`badge ${sig.severity === 'HIGH' ? 'badge-red' : sig.severity === 'MEDIUM' ? 'badge-amber' : 'badge-green'}`}>
                        {sig.severity}
                      </span>
                      <span className="badge badge-blue">{sig.category}</span>
                      <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>{sig.detectedAt} · {sig.chain}</span>
                    </div>
                    <div className="signal-title">{sig.title}</div>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-tertiary)', flexShrink: 0 }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>

                <p className="signal-desc">{sig.description}</p>

                {isOpen && (
                  <>
                    <div className="signal-metrics">
                      {sig.metrics.map((m, i) => (
                        <div key={i} className="metric-chip">
                          <div className="metric-chip-label">{m.label}</div>
                          <div className="metric-chip-val">
                            {m.value}
                            {m.change && (
                              <span className={`metric-delta ${m.dir === 'down' ? 'neg' : 'pos'}`}>{m.change}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="ai-box">
                      <div className="ai-box-header">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Recommended Action
                      </div>
                      <p className="ai-box-text">{sig.recommendation}</p>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon" style={{ color: 'var(--green)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="empty-state-title">No signals match</div>
                <div className="empty-state-desc">Try adjusting severity or category filters.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
