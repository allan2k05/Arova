'use client';

import { useState } from 'react';
import AppShell from '../components/AppShell';
import Link from 'next/link';

const ALL_PROTOCOLS = [
  {
    id: 'aave-v3', name: 'Aave v3', icon: '⚡', color: '#B6509E', category: 'Lending', chain: 'Ethereum',
    tvl: 11.8, apy: 4.2, volume24h: 842, revenue24h: 1.8, utilization: 71.2,
    risk: 'Low', audited: true, schema: 'Messari', flashLoans: true, multiChain: true,
    auditBy: 'OpenZeppelin, Trail of Bits', founded: '2020',
    description: 'Non-custodial liquidity protocol with isolated markets and risk parameters.',
  },
  {
    id: 'compound-v3', name: 'Compound v3', icon: '🏛️', color: '#00D395', category: 'Lending', chain: 'Ethereum',
    tvl: 2.4, apy: 3.8, volume24h: 211, revenue24h: 0.4, utilization: 58.4,
    risk: 'Low', audited: true, schema: 'Messari', flashLoans: false, multiChain: true,
    auditBy: 'OpenZeppelin', founded: '2018',
    description: 'Algorithmic money market with comet architecture for capital efficiency.',
  },
  {
    id: 'uniswap-v3', name: 'Uniswap v3', icon: '🦄', color: '#FF007A', category: 'DEX', chain: 'Ethereum',
    tvl: 4.9, apy: 12.4, volume24h: 1200, revenue24h: 3.6, utilization: 0,
    risk: 'Medium', audited: true, schema: 'Official', flashLoans: true, multiChain: true,
    auditBy: 'Trail of Bits, ABDK', founded: '2018',
    description: 'Concentrated liquidity AMM with customizable fee tiers per pool.',
  },
  {
    id: 'balancer-v2', name: 'Balancer v2', icon: '⚖️', color: '#1982FF', category: 'DEX', chain: 'Ethereum',
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

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 6, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
    </div>
  );
}

function Winner({ protos, field }: { protos: Proto[]; field: keyof Proto }) {
  const vals = protos.map(p => Number(p[field]));
  const max  = Math.max(...vals);
  return (
    <>
      {protos.map((p, i) => (
        <div key={p.id} style={{ textAlign: 'center', padding: '12px 8px', borderRight: i < protos.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{
            fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15,
            color: vals[i] === max ? 'var(--green)' : 'var(--text-primary)',
          }}>
            {field === 'tvl' ? formatTvl(vals[i]) : field === 'volume24h' || field === 'revenue24h' ? formatVol(vals[i]) : `${vals[i]}%`}
          </div>
          {vals[i] === max && protos.length > 1 && (
            <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 2, fontFamily: 'var(--mono)' }}>▲ Highest</div>
          )}
          <Bar value={vals[i]} max={Math.max(...vals) || 1} color={p.color} />
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
        if (prev.length <= 1) return prev; // keep at least 1
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 4) return prev; // max 4
      return [...prev, id];
    });
  };

  const compared = selected.map(id => ALL_PROTOCOLS.find(p => p.id === id)!).filter(Boolean);
  const colW = `${100 / compared.length}%`;

  const rows: { label: string; field: keyof Proto; render?: (p: Proto) => React.ReactNode }[] = [
    { label: 'Category', field: 'category', render: p => <span className={`badge ${p.category === 'Lending' ? 'badge-purple' : 'badge-cyan'}`}>{p.category}</span> },
    { label: 'Chain', field: 'chain', render: p => <span className="badge badge-neutral">{p.chain}</span> },
    { label: 'Schema', field: 'schema', render: p => <span className={`badge ${p.schema === 'Messari' ? 'badge-blue' : 'badge-neutral'}`}>{p.schema}</span> },
    { label: 'Risk Level', field: 'risk', render: p => <span className={`badge ${p.risk === 'Low' ? 'badge-green' : 'badge-amber'}`}>{p.risk}</span> },
    { label: 'Audited', field: 'audited', render: p => p.audited
      ? <span className="badge badge-green">✓ Yes</span>
      : <span className="badge badge-red">✗ No</span>
    },
    { label: 'Flash Loans', field: 'flashLoans', render: p => p.flashLoans
      ? <span className="badge badge-blue">Supported</span>
      : <span className="badge badge-neutral">No</span>
    },
    { label: 'Multi-chain', field: 'multiChain', render: p => p.multiChain
      ? <span className="badge badge-green">Yes</span>
      : <span className="badge badge-neutral">No</span>
    },
    { label: 'Founded', field: 'founded', render: p => <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{p.founded}</span> },
    { label: 'Audited By', field: 'auditBy', render: p => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p.auditBy}</span> },
  ];

  return (
    <AppShell>
      <div className="topbar">
        <span className="topbar-breadcrumb">Explore</span>
        <span className="topbar-divider">/</span>
        <span className="topbar-title">Compare Protocols</span>
        <div className="topbar-actions">
          <span className="text-xs text-muted">Select 2–4 protocols</span>
        </div>
      </div>

      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Protocol Comparison</h1>
          <p className="page-subtitle">Compare DeFi protocols side-by-side across TVL, APY, revenue, risk, and schema compatibility.</p>
        </div>

        {/* Protocol Picker */}
        <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Select protocols to compare ({selected.length}/4 selected)
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {ALL_PROTOCOLS.map(p => {
              const isSelected = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProtocol(p.id)}
                  className="btn btn-ghost"
                  style={{
                    borderColor: isSelected ? p.color : 'var(--border)',
                    background: isSelected ? `${p.color}15` : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    gap: 8,
                  }}
                >
                  <span>{p.icon}</span>
                  {p.name}
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {compared.length >= 1 && (
          <div className="card" style={{ overflow: 'auto' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: `180px ${compared.map(() => colW).join(' ')}`, borderBottom: '1px solid var(--border)' }}>
              <div style={{ padding: '14px 16px' }} />
              {compared.map(p => (
                <div key={p.id} style={{ padding: '16px 12px', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{p.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{p.chain}</div>
                </div>
              ))}
            </div>

            {/* Numeric metrics */}
            {[
              { label: 'Total Value Locked', field: 'tvl' as const },
              { label: 'Avg APY', field: 'apy' as const },
              { label: '24h Volume', field: 'volume24h' as const },
              { label: '24h Revenue', field: 'revenue24h' as const },
              { label: 'Utilization Rate', field: 'utilization' as const },
            ].map(({ label, field }) => (
              <div
                key={field}
                style={{ display: 'grid', gridTemplateColumns: `180px ${compared.map(() => colW).join(' ')}`, borderBottom: '1px solid var(--border)' }}
              >
                <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                  {label}
                </div>
                <Winner protos={compared} field={field} />
              </div>
            ))}

            {/* Qualitative rows */}
            {rows.map(row => (
              <div
                key={row.field}
                style={{ display: 'grid', gridTemplateColumns: `180px ${compared.map(() => colW).join(' ')}`, borderBottom: '1px solid var(--border)' }}
              >
                <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                  {row.label}
                </div>
                {compared.map((p, i) => (
                  <div key={p.id} style={{ padding: '12px 8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border)' }}>
                    {row.render ? row.render(p) : <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{String(p[row.field])}</span>}
                  </div>
                ))}
              </div>
            ))}

            {/* Description row */}
            <div style={{ display: 'grid', gridTemplateColumns: `180px ${compared.map(() => colW).join(' ')}` }}>
              <div style={{ padding: '12px 16px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-tertiary)', alignSelf: 'start', paddingTop: 16 }}>About</div>
              {compared.map((p, i) => (
                <div key={p.id} style={{ padding: '14px 12px', fontSize: 12.5, color: 'var(--text-tertiary)', lineHeight: 1.55, borderLeft: '1px solid var(--border)' }}>
                  {p.description}
                  <div style={{ marginTop: 12 }}>
                    <Link href={`/copilot?protocol=${p.id}`} className="btn btn-ghost btn-sm" style={{ fontSize: 11.5 }}>
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
