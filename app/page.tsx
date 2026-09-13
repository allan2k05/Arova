'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import AppShell from './components/AppShell';
import Link from 'next/link';

type Severity = 'HIGH' | 'MEDIUM' | 'INFO';

interface Flag {
  id: string;
  protocolId: string;
  protocolName: string;
  category: 'lending' | 'dex';
  severity: Severity;
  title: string;
  description: string;
  explanation: string;
  metrics: { label: string; current: string; previous: string; changePct: string }[];
}

interface ScanResult {
  protocolId: string;
  protocolName: string;
  category: string;
  tvl: string;
  flags: Flag[];
  error?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const PROTOCOLS_META = [
  { id: 'aave-v3',      name: 'Aave v3',      category: 'Lending', chain: 'Ethereum', tvl: '$11.8B' },
  { id: 'compound-v3',  name: 'Compound v3',  category: 'Lending', chain: 'Ethereum', tvl: '$2.4B'  },
  { id: 'uniswap-v3',   name: 'Uniswap v3',   category: 'DEX',     chain: 'Ethereum', tvl: '$4.9B'  },
  { id: 'balancer-v2',  name: 'Balancer v2',  category: 'DEX',     chain: 'Ethereum', tvl: '$1.1B'  },
];

const SUGGESTIONS = [
  'Why is Aave v3 APY fluctuating?',
  'Compare Uniswap v3 24h volume',
  'Aave vs Compound risk profile',
  'Balancer v2 protocol anomalies',
];

function Topbar({ lastScanned, isScanning, onScan }: {
  lastScanned: string | null;
  isScanning: boolean;
  onScan: () => void;
}) {
  return (
    <div className="topbar">
      <span className="topbar-title">Dashboard</span>
      {lastScanned && (
        <span className="topbar-breadcrumb" style={{ marginLeft: 8 }}>
          — Last scan {lastScanned}
        </span>
      )}
      <div className="topbar-actions">
        <Link href="/protocols" className="btn btn-outline btn-sm">
          View protocols
        </Link>
        <button
          className="btn btn-primary btn-sm"
          onClick={onScan}
          disabled={isScanning}
          id="run-audit-btn"
        >
          {isScanning ? (
            <span>Scanning...</span>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Run audit
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [isScanning, setIsScanning]   = useState(false);
  const [results,    setResults]      = useState<ScanResult[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'INFO'>('ALL');

  const [chatInput,    setChatInput]    = useState('');
  const [messages,     setMessages]     = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'model',
    text: 'Hello! I\'m the Arova AI assistant. I analyze DeFi protocols, explain risk signals, and query live subgraph data. Run an audit or ask me anything.',
  }]);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const allFlags     = results.flatMap(r => r.flags);
  const highCount    = allFlags.filter(f => f.severity === 'HIGH').length;
  const totalTvl     = results.length > 0 ? results.filter(r => r.tvl !== 'N/A' && r.tvl !== 'Error').length : null;

  const filteredFlags = allFlags.filter(f => {
    if (activeFilter === 'ALL') return true;
    return f.severity === activeFilter;
  });

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res  = await fetch('/api/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setLastScanned(new Date(data.scannedAt).toLocaleTimeString());
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: `Audit complete. Scanned ${PROTOCOLS_META.length} protocols — found ${data.totalFlags} risk signal${data.totalFlags !== 1 ? 's' : ''}.`,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Scan failed — network error.' }]);
    }
    setIsScanning(false);
  };

  const handleChat = useCallback(async (text?: string) => {
    const prompt = (text ?? chatInput).trim();
    if (!prompt || isChatting) return;
    setChatInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: prompt }]);
    setIsChatting(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: prompt, flags: allFlags, history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id:   Date.now().toString(),
        role: 'model',
        text: data.success ? data.answer : `Error: ${data.error}`,
      }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Network error communicating with AI.' }]);
    }
    setIsChatting(false);
  }, [chatInput, isChatting, messages, allFlags]);

  return (
    <AppShell>
      <Topbar lastScanned={lastScanned} isScanning={isScanning} onScan={handleScan} />

      <div className="page-content">
        {/* ── Top Metrics Strip (Single bar hairline-divided into 4 segments) ── */}
        <div className="top-metrics-strip">
          <div className="metric-segment">
            <div className="metric-segment-label">Monitored protocols</div>
            <div className="metric-segment-value">{PROTOCOLS_META.length}</div>
            <div className="metric-segment-sub">Aave, Compound, Uniswap, Balancer</div>
          </div>

          <div className="metric-segment">
            <div className="metric-segment-label">High severity signals</div>
            <div className="metric-segment-value" style={{ color: highCount > 0 ? 'var(--severity-high)' : 'var(--severity-none)' }}>
              {highCount}
            </div>
            <div className="metric-segment-sub">{allFlags.length} total signals detected</div>
          </div>

          <div className="metric-segment">
            <div className="metric-segment-label">Protocols scanned</div>
            <div className="metric-segment-value">
              {totalTvl !== null ? `${totalTvl} / 4` : '—'}
            </div>
            <div className="metric-segment-sub">{results.length === 0 ? 'No scan yet' : 'Live subgraph data'}</div>
          </div>

          <div className="metric-segment">
            <div className="metric-segment-label">AI model</div>
            <div className="metric-segment-value" style={{ fontSize: 18 }}>Gemini</div>
            <div className="metric-segment-sub">Graph MCP, Live subgraphs</div>
          </div>
        </div>

        {/* ── Protocol List Terminal Table ── */}
        <div className="mb-6">
          <div className="card-header mb-2">
            <div className="card-title">Monitored protocols</div>
            <div className="card-subtitle">Real-time indexing status across Subgraph Studio</div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Protocol</th>
                  <th>Category</th>
                  <th>Chain</th>
                  <th style={{ textAlign: 'right' }}>TVL</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {PROTOCOLS_META.map((p) => {
                  const scanned = results.find(r => r.protocolId === p.id);
                  const tvl     = scanned ? scanned.tvl : p.tvl;
                  const flags   = scanned ? scanned.flags.length : null;
                  const hasHigh = scanned?.flags.some(f => f.severity === 'HIGH');

                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <Link href={`/protocols/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {p.name}
                        </Link>
                      </td>
                      <td className="text-muted">{p.category}</td>
                      <td className="text-muted">{p.chain}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>{tvl}</td>
                      <td style={{ textAlign: 'right' }}>
                        {flags !== null ? (
                          <span className="status-indicator">
                            <span className="status-dot" style={{ background: hasHigh ? 'var(--severity-high)' : flags > 0 ? 'var(--severity-medium)' : 'var(--severity-none)' }} />
                            <span className="text-sm">{flags === 0 ? 'clean' : `${flags} signal${flags > 1 ? 's' : ''}`}</span>
                          </span>
                        ) : (
                          <span className="status-indicator">
                            <span className="status-dot idle" />
                            <span className="text-sm text-muted">standby</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Main Grid: Risk Signals & AI Console ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          {/* Left: Risk Signals Feed */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="card-title">
                Risk signals
                {allFlags.length > 0 && (
                  <span style={{ marginLeft: 8, color: 'var(--severity-high)', fontFamily: 'var(--mono)' }}>[{allFlags.length}]</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['ALL', 'HIGH', 'MEDIUM', 'INFO'] as const).map(f => (
                  <button
                    key={f}
                    className={`btn btn-sm ${activeFilter === f ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: 11, padding: '3px 8px' }}
                    onClick={() => setActiveFilter(f)}
                  >
                    {f === 'ALL' ? `All (${allFlags.length})` : f}
                  </button>
                ))}
              </div>
            </div>

            {results.length === 0 ? (
              <div className="card text-center" style={{ padding: '40px 20px' }}>
                <div className="text-muted text-sm" style={{ marginBottom: 16 }}>
                  No audit scan executed yet. Run an audit scan to query live subgraph data.
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleScan} disabled={isScanning}>
                  Run audit scan
                </button>
              </div>
            ) : filteredFlags.length === 0 ? (
              <div className="card text-center" style={{ padding: '30px 20px' }}>
                <div className="status-indicator justify-between" style={{ justifyContent: 'center', marginBottom: 8 }}>
                  <span className="status-dot online" />
                  <span style={{ color: 'var(--severity-none)', fontWeight: 600 }}>All monitored parameters clean</span>
                </div>
                <div className="text-xs text-muted">No signals matching the selected filter severity.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredFlags.map(f => (
                  <div key={f.id} className="card" style={{ borderLeft: `3px solid ${f.severity === 'HIGH' ? 'var(--severity-high)' : f.severity === 'MEDIUM' ? 'var(--severity-medium)' : 'var(--severity-info)'}` }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-mono text-muted">{f.protocolName}</span>
                      <span className="text-xs font-mono" style={{ color: f.severity === 'HIGH' ? 'var(--severity-high)' : 'var(--severity-medium)' }}>
                        {f.severity}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{f.title}</div>
                    <p className="text-xs text-muted" style={{ lineHeight: 1.5, marginBottom: 8 }}>{f.explanation || f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: AI Copilot Console */}
          <div className="console-panel">
            <div className="console-header">
              <span>Arova AI console</span>
              <span className="text-xs font-mono text-muted">Gemini Core</span>
            </div>

            <div className="console-feed" style={{ height: 380 }}>
              {messages.map(m => (
                <div key={m.id} className="console-item">
                  <div className="console-timestamp">{m.role === 'user' ? '► USER PROMPT' : '✦ AROVA AGENT'}</div>
                  <div className="console-text">{m.text}</div>
                </div>
              ))}
              {isChatting && (
                <div className="console-item">
                  <div className="console-timestamp">✦ AROVA AGENT</div>
                  <div className="console-text text-muted">Processing response...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Prompt suggestions */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => handleChat(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div className="console-input-row">
              <input
                className="console-input"
                placeholder="Ask follow-up question..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleChat(); }}
                disabled={isChatting}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleChat()}
                disabled={!chatInput.trim() || isChatting}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
