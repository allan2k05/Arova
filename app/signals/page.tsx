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
    title: 'Unusual TVL drop detected',
    description: 'Total value locked dropped more than 12% over the last 24 hours — threshold breached.',
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
    title: 'Flash loan volume spike',
    description: 'Flash loan volume is 8.3x the 7-day average — possible price manipulation or arbitrage event.',
    detectedAt: '45m ago',
    chain: 'Ethereum',
    metrics: [
      { label: 'Flash loan vol', value: '$2.1B', change: '+726%', dir: 'up' },
      { label: '7d avg flash vol', value: '$254M' },
      { label: '24h fees', value: '$8.4M', change: '+312%', dir: 'up' },
    ],
    recommendation: 'Review oracle price feeds for any manipulation. Check if protocol-owned liquidity pools were targeted.',
  },
  {
    id: 's3',
    severity: 'MEDIUM',
    category: 'Market',
    protocol: 'Compound v3',
    title: 'Supply APY compression',
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
    title: 'Pool imbalance detected',
    description: 'The WETH/USDC/DAI pool weights deviated more than 15% from target, suggesting large directional trade.',
    detectedAt: '3h ago',
    chain: 'Ethereum',
    metrics: [
      { label: 'WETH weight', value: '38.2%', change: '-11.8%', dir: 'down' },
      { label: 'Target weight', value: '50%' },
      { label: 'Pool TVL', value: '$84M', change: '-7.3%', dir: 'down' },
    ],
    recommendation: 'Pool rebalancing arbitrage is likely ongoing. Monitor for sustained impermanent loss exposure.',
  },
  {
    id: 's5',
    severity: 'INFO',
    category: 'Smart Contract',
    protocol: 'Aave v3',
    title: 'Reserve factor updated',
    description: 'Governance proposal passed — WBTC reserve factor increased from 20% to 25%.',
    detectedAt: '12h ago',
    chain: 'Ethereum',
    metrics: [
      { label: 'New reserve factor', value: '25%', change: '+5%', dir: 'up' },
      { label: 'Prior reserve factor', value: '20%' },
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

  const catLabel = ['All', 'Security', 'Liquidity', 'Market', 'Smart Contract'] as const;

  return (
    <AppShell>
      <div className="topbar">
        <span className="topbar-breadcrumb">Explore</span>
        <span className="topbar-divider">/</span>
        <span className="topbar-title">Risk signals</span>
      </div>

      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Risk & security signals</h1>
          <p className="page-subtitle">
            Real-time anomaly detection across monitored DeFi protocols via The Graph subgraph analytics.
          </p>
        </div>

        {/* Financial Terminal Metrics Strip */}
        <div className="top-metrics-strip mb-6">
          <div className="metric-segment">
            <div className="metric-segment-label">High severity</div>
            <div className="metric-segment-value" style={{ color: 'var(--severity-high)' }}>{highCount}</div>
          </div>
          <div className="metric-segment">
            <div className="metric-segment-label">Medium severity</div>
            <div className="metric-segment-value" style={{ color: 'var(--severity-medium)' }}>{medCount}</div>
          </div>
          <div className="metric-segment">
            <div className="metric-segment-label">Informational</div>
            <div className="metric-segment-value" style={{ color: 'var(--severity-none)' }}>{infoCount}</div>
          </div>
          <div className="metric-segment">
            <div className="metric-segment-label">Protocols monitored</div>
            <div className="metric-segment-value">4</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card mb-4" style={{ padding: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {(['ALL', 'HIGH', 'MEDIUM', 'INFO'] as const).map(s => (
              <button
                key={s}
                className={`btn btn-sm ${severityFilter === s ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() => setSeverityFilter(s)}
              >
                {s === 'ALL' ? `All (${STATIC_SIGNALS.length})` : s}
              </button>
            ))}

            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

            {catLabel.map(c => (
              <button
                key={c}
                className={`btn btn-sm ${categoryFilter === c ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: 11, padding: '4px 10px' }}
                onClick={() => setCategoryFilter(c as typeof categoryFilter)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Signal list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(sig => {
            const isOpen = expanded === sig.id;
            return (
              <div
                key={sig.id}
                className="card"
                style={{
                  borderLeft: `3px solid ${sig.severity === 'HIGH' ? 'var(--severity-high)' : sig.severity === 'MEDIUM' ? 'var(--severity-medium)' : 'var(--severity-info)'}`,
                  cursor: 'pointer',
                }}
                onClick={() => setExpanded(isOpen ? null : sig.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="font-mono text-xs text-muted">{sig.protocol}</span>
                    <span className="font-mono text-xs" style={{ color: sig.severity === 'HIGH' ? 'var(--severity-high)' : sig.severity === 'MEDIUM' ? 'var(--severity-medium)' : 'var(--severity-info)' }}>
                      [{sig.severity}]
                    </span>
                    <span className="text-xs text-muted">{sig.category}</span>
                  </div>
                  <span className="text-xs text-muted font-mono">{sig.detectedAt} · {sig.chain}</span>
                </div>

                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{sig.title}</div>
                <p className="text-sm text-muted" style={{ lineHeight: 1.5 }}>{sig.description}</p>

                {isOpen && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                      {sig.metrics.map((m, i) => (
                        <div key={i} style={{ borderLeft: '1px solid var(--border)', paddingLeft: 10 }}>
                          <div className="text-xs text-muted">{m.label}</div>
                          <div className="font-mono" style={{ fontSize: 14, fontWeight: 600 }}>
                            {m.value} {m.change && <span style={{ color: m.dir === 'down' ? 'var(--severity-high)' : 'var(--severity-none)', fontSize: 12 }}>({m.change})</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: 12 }}>
                      <div className="text-xs font-mono mb-1" style={{ color: 'var(--accent)' }}>RECOMMENDED ACTION</div>
                      <div className="text-xs text-muted" style={{ lineHeight: 1.5 }}>{sig.recommendation}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
