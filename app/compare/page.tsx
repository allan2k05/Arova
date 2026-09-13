'use client';

import { useState } from 'react';
import AppShell from '../components/AppShell';
import Link from 'next/link';

const ALL_PROTOCOLS = [
  {
    id: 'aave-v3', name: 'Aave v3', category: 'Lending', chain: 'Ethereum',
    tvl: 11.8, apy: 4.2, volume24h: 842, revenue24h: 1.8, utilization: 71.2,
    risk: 'Low', audited: true, schema: 'Messari', flashLoans: true, multiChain: true,
    auditBy: 'OpenZeppelin, Trail of Bits', founded: '2020',
    description: 'Non-custodial liquidity protocol with isolated markets and risk parameters.',
  },
  {
    id: 'compound-v3', name: 'Compound v3', category: 'Lending', chain: 'Ethereum',
    tvl: 2.4, apy: 3.8, volume24h: 211, revenue24h: 0.4, utilization: 58.4,
    risk: 'Low', audited: true, schema: 'Messari', flashLoans: false, multiChain: true,
    auditBy: 'OpenZeppelin', founded: '2018',
    description: 'Algorithmic money market with comet architecture for capital efficiency.',
  },
  {
    id: 'uniswap-v3', name: 'Uniswap v3', category: 'DEX', chain: 'Ethereum',
    tvl: 4.9, apy: 12.4, volume24h: 1200, revenue24h: 3.6, utilization: 0,
    risk: 'Medium', audited: true, schema: 'Official', flashLoans: true, multiChain: true,
    auditBy: 'Trail of Bits, ABDK', founded: '2018',
    description: 'Concentrated liquidity AMM with customizable fee tiers per pool.',
  },
  {
    id: 'balancer-v2', name: 'Balancer v2', category: 'DEX', chain: 'Ethereum',
    tvl: 1.1, apy: 8.1, volume24h: 98, revenue24h: 0.3, utilization: 0,
    risk: 'Medium', audited: true, schema: 'Messari', flashLoans: true, multiChain: true,
    auditBy: 'Certora, Trail of Bits', founded: '2020',
    description: 'Multi-token weighted pools with automated portfolio management.',
  },
];

type Proto = typeof ALL_PROTOCOLS[0];

function formatTvl(n: number) {
  return n >= 1 ? `$${n.toFixed(1)}B` : `$${(n * 1000).toFixed(0)}M`;
}

function formatVol(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n}M`;
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div style={{
      width: '80%',
      maxWidth: 140,
      height: 4,
      background: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 6,
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: 'var(--color-gold)',
        borderRadius: 2,
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
}

function Winner({ protos, field }: { protos: Proto[]; field: keyof Proto }) {
  const vals = protos.map(p => Number(p[field]));
  const max  = Math.max(...vals);
  return (
    <>
      {protos.map((p, i) => (
        <div
          key={p.id}
          style={{
            textAlign: 'center',
            padding: '12px 16px',
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div className="font-mono" style={{
            fontWeight: 600, fontSize: 14,
            color: vals[i] === max ? 'var(--severity-none)' : 'var(--text-primary)',
          }}>
            {field === 'tvl' ? formatTvl(vals[i]) : field === 'volume24h' || field === 'revenue24h' ? formatVol(vals[i]) : `${vals[i]}%`}
          </div>
          {vals[i] === max && protos.length > 1 && (
            <div className="text-xs font-mono" style={{ color: 'var(--severity-none)', marginTop: 2 }}>▲ highest</div>
          )}
          <Bar value={vals[i]} max={max || 1} />
        </div>
      ))}
    </>
  );
}

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>(['aave-v3', 'compound-v3']);

  const toggleProtocol = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const compared = selected.map(id => ALL_PROTOCOLS.find(p => p.id === id)!).filter(Boolean);
  const gridCols = `180px repeat(${compared.length}, 1fr)`;

  const rows: { label: string; field: keyof Proto; render?: (p: Proto) => React.ReactNode }[] = [
    { label: 'Category', field: 'category', render: p => <span className="text-xs text-muted">{p.category}</span> },
    { label: 'Chain', field: 'chain', render: p => <span className="text-xs text-muted">{p.chain}</span> },
    { label: 'Schema', field: 'schema', render: p => <span className="text-xs font-mono text-muted">{p.schema}</span> },
    { label: 'Risk level', field: 'risk', render: p => <span className="text-xs font-mono" style={{ color: p.risk === 'Low' ? 'var(--severity-none)' : 'var(--severity-medium)' }}>{p.risk}</span> },
    { label: 'Audited', field: 'audited', render: p => p.audited ? <span style={{ color: 'var(--severity-none)', fontSize: 12 }}>✓ Yes</span> : <span style={{ color: 'var(--severity-high)', fontSize: 12 }}>✗ No</span> },
    { label: 'Flash loans', field: 'flashLoans', render: p => <span className="text-xs text-muted">{p.flashLoans ? 'Supported' : 'No'}</span> },
    { label: 'Founded', field: 'founded', render: p => <span className="text-xs font-mono text-muted">{p.founded}</span> },
    { label: 'Audit firm', field: 'auditBy', render: p => <span className="text-xs text-muted">{p.auditBy}</span> },
  ];

  return (
    <AppShell>
      <div className="topbar">
        <span className="topbar-breadcrumb">Explore</span>
        <span className="topbar-divider">/</span>
        <span className="topbar-title">Compare protocols</span>
      </div>

      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Protocol comparison</h1>
          <p className="page-subtitle">Compare DeFi protocols side-by-side across TVL, APY, revenue, risk, and schema compatibility.</p>
        </div>

        {/* Protocol Picker */}
        <div className="card mb-6" style={{ padding: 16 }}>
          <div className="text-xs text-muted mb-2 font-mono">
            Select protocols to compare ({selected.length} / 4)
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ALL_PROTOCOLS.map(p => {
              const isSelected = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProtocol(p.id)}
                  className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                >
                  {p.name}
                  {isSelected && <span style={{ marginLeft: 4 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {compared.length >= 1 && (
          <div className="data-table-wrap">
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: gridCols, borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '14px 16px' }} />
              {compared.map(p => (
                <div key={p.id} style={{ padding: '14px 12px', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{p.name}</div>
                  <div className="text-xs text-muted font-mono" style={{ marginTop: 2 }}>{p.chain}</div>
                </div>
              ))}
            </div>

            {/* Numeric metrics */}
            {[
              { label: 'Total value locked', field: 'tvl' as const },
              { label: 'Avg APY', field: 'apy' as const },
              { label: '24h Volume', field: 'volume24h' as const },
              { label: '24h Revenue', field: 'revenue24h' as const },
              { label: 'Utilization rate', field: 'utilization' as const },
            ].map(({ label, field }) => (
              <div
                key={field}
                style={{ display: 'grid', gridTemplateColumns: gridCols, borderBottom: '1px solid var(--border)' }}
              >
                <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {label}
                </div>
                <Winner protos={compared} field={field} />
              </div>
            ))}

            {/* Qualitative rows */}
            {rows.map(row => (
              <div
                key={row.field}
                style={{ display: 'grid', gridTemplateColumns: gridCols, borderBottom: '1px solid var(--border)' }}
              >
                <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {row.label}
                </div>
                {compared.map((p) => (
                  <div key={p.id} style={{ padding: '12px 8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border)' }}>
                    {row.render ? row.render(p) : <span className="text-xs text-muted">{String(p[row.field])}</span>}
                  </div>
                ))}
              </div>
            ))}

            {/* Description row */}
            <div style={{ display: 'grid', gridTemplateColumns: gridCols }}>
              <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'start', paddingTop: 16 }}>About</div>
              {compared.map((p) => (
                <div key={p.id} style={{ padding: '14px 12px', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5, borderLeft: '1px solid var(--border)' }}>
                  {p.description}
                  <div style={{ marginTop: 12 }}>
                    <Link href={`/copilot?protocol=${p.id}`} className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
                      Query in IDE →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
