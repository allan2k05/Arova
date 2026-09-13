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
  { id: 'aave-v3',      name: 'Aave v3',      category: 'Lending', chain: 'Ethereum', tvl: '$11.8B', icon: '⚡', color: '#B6509E' },
  { id: 'compound-v3',  name: 'Compound v3',  category: 'Lending', chain: 'Ethereum', tvl: '$2.4B',  icon: '🏛️', color: '#00D395' },
  { id: 'uniswap-v3',   name: 'Uniswap v3',   category: 'DEX',     chain: 'Ethereum', tvl: '$4.9B',  icon: '🦄', color: '#FF007A' },
  { id: 'balancer-v2',  name: 'Balancer v2',  category: 'DEX',     chain: 'Ethereum', tvl: '$1.1B',  icon: '⚖️', color: '#1E1E6D' },
];

const SUGGESTIONS = [
  'Why is Aave v3 APY fluctuating?',
  'Compare Uniswap v3 24h volume',
  'Aave vs Compound risk profile',
  'Balancer v2 protocol anomalies',
];

function SeverityBadge({ sev }: { sev: Severity }) {
  const map: Record<Severity, string> = {
    HIGH: 'badge-red', MEDIUM: 'badge-amber', INFO: 'badge-green',
  };
  return <span className={`badge ${map[sev]}`}>{sev}</span>;
}

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
        <Link href="/protocols" className="btn btn-ghost btn-sm">
          View Protocols
        </Link>
        <button
          className="btn btn-primary btn-sm"
          onClick={onScan}
          disabled={isScanning}
          id="run-audit-btn"
        >
          {isScanning ? (
            <span className="scan-loading">
              <span className="loading-ring" />
              Scanning...
            </span>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Run Audit
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
    text: 'Hello! I\'m the Arova AI assistant. I can analyze DeFi protocols, explain risk signals, and query live subgraph data. Run an audit or ask me anything.',
  }]);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }
  };

  // auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [chatInput]);

  return (
    <AppShell>
      <Topbar lastScanned={lastScanned} isScanning={isScanning} onScan={handleScan} />

      <div className="page-content">
        {/* ── Stats Row ─────────────────────────────────── */}
        <div className="stats-grid">
          <div className="stat-card accent-blue">
            <div className="stat-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>
              Monitored Protocols
            </div>
            <div className="stat-value blue">{PROTOCOLS_META.length}</div>
            <div className="stat-sub">Aave · Compound · Uniswap · Balancer</div>
          </div>

          <div className="stat-card accent-red">
            <div className="stat-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              High Severity
            </div>
            <div className={`stat-value ${highCount > 0 ? 'red' : 'green'}`}>{highCount}</div>
            <div className="stat-sub">{allFlags.length} total signals detected</div>
          </div>

          <div className="stat-card accent-green">
            <div className="stat-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              Protocols Scanned
            </div>
            <div className={`stat-value ${totalTvl !== null ? 'green' : ''}`}>
              {totalTvl !== null ? `${totalTvl} / 4` : '—'}
            </div>
            <div className="stat-sub">{results.length === 0 ? 'No scan yet' : 'Live subgraph data'}</div>
          </div>

          <div className="stat-card accent-purple">
            <div className="stat-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              AI Model
            </div>
            <div className="stat-value purple" style={{ fontSize: 18 }}>Gemini</div>
            <div className="stat-sub">Graph MCP · Live subgraphs</div>
          </div>
        </div>

        {/* ── Protocol Cards ─────────────────────────── */}
        <div className="protocols-grid">
          {PROTOCOLS_META.map((p) => {
            const scanned  = results.find(r => r.protocolId === p.id);
            const tvl      = scanned ? scanned.tvl : p.tvl;
            const flags    = scanned ? scanned.flags.length : null;
            const hasHigh  = scanned?.flags.some(f => f.severity === 'HIGH');

            return (
              <Link key={p.id} href={`/protocols#${p.id}`} className="protocol-card">
                <div className="protocol-card-header">
                  <div className="protocol-card-icon" style={{ background: `${p.color}18`, borderColor: `${p.color}40` }}>
                    {p.icon}
                  </div>
                  {flags !== null ? (
                    <span className={`badge ${hasHigh ? 'badge-red' : flags > 0 ? 'badge-amber' : 'badge-green'}`}>
                      {flags === 0 ? 'Clean' : `${flags} flag${flags > 1 ? 's' : ''}`}
                    </span>
                  ) : (
                    <span className="badge badge-neutral">Standby</span>
                  )}
                </div>
                <div>
                  <div className="protocol-name">{p.name}</div>
                  <div className="protocol-chain">{p.category} · {p.chain}</div>
                </div>
                <div className="protocol-card-footer">
                  <div className="protocol-card-tvl">{tvl}</div>
                  <span className="text-xs text-muted">TVL</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Main Grid: Signals + Chat ──────────────── */}
        <div className="dashboard-grid">
          {/* Left: Risk Signals Feed */}
          <div>
            {/* Filter bar */}
            <div className="flex items-center justify-between mb-4" style={{ gap: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Risk Signals
                {allFlags.length > 0 && (
                  <span className="badge badge-red" style={{ marginLeft: 8 }}>{allFlags.length}</span>
                )}
              </h2>
              <div className="filter-bar" style={{ margin: 0 }}>
                {(['ALL', 'HIGH', 'MEDIUM', 'INFO'] as const).map(f => (
                  <button
                    key={f}
                    className={`filter-btn${activeFilter === f ? ' active' : ''}`}
                    onClick={() => setActiveFilter(f)}
                  >
                    {f === 'ALL' ? `All (${allFlags.length})` : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Signals list */}
            {results.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <div className="empty-state-title">No audit run yet</div>
                  <div className="empty-state-desc">
                    Click <strong>Run Audit</strong> to scan Aave, Compound, Uniswap and Balancer subgraphs for live risk signals.
                  </div>
                  <button className="btn btn-primary" onClick={handleScan} disabled={isScanning}>
                    {isScanning ? 'Scanning...' : 'Start Audit'}
                  </button>
                </div>
              </div>
            ) : filteredFlags.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon" style={{ color: 'var(--green)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div className="empty-state-title">No signals for this filter</div>
                  <div className="empty-state-desc">All monitored parameters are within safe thresholds for the selected severity.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredFlags.map(flag => {
                  const isNeg = (pct: string) => pct.startsWith('-');
                  return (
                    <article key={flag.id} className={`signal-card sev-${flag.severity}`}>
                      <div className="signal-top">
                        <div>
                          <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                            <span className={`badge ${flag.category === 'lending' ? 'badge-purple' : 'badge-cyan'}`}>
                              {flag.protocolName}
                            </span>
                            <SeverityBadge sev={flag.severity} />
                          </div>
                          <div className="signal-title">{flag.title}</div>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleChat(`Can you perform a deeper breakdown on the "${flag.title}" flag for ${flag.protocolName}?`)}
                          style={{ flexShrink: 0 }}
                        >
                          Ask AI
                        </button>
                      </div>

                      <p className="signal-desc">{flag.description}</p>

                      {flag.metrics.length > 0 && (
                        <div className="signal-metrics">
                          {flag.metrics.map((m, i) => (
                            <div key={i} className="metric-chip">
                              <div className="metric-chip-label">{m.label}</div>
                              <div className="metric-chip-val">
                                {m.current}
                                <span className={`metric-delta ${isNeg(m.changePct) ? 'neg' : 'pos'}`}>{m.changePct}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {flag.explanation && (
                        <div className="ai-box">
                          <div className="ai-box-header">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                            Gemini Analysis
                          </div>
                          <p className="ai-box-text">{flag.explanation}</p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: AI Chat Panel */}
          <div className="card" style={{ height: 'calc(100vh - 220px)', minHeight: 500, position: 'sticky', top: 80, display: 'flex', flexDirection: 'column' }}>
            <div className="chat-panel-header">
              <div className="chat-ai-badge">
                <div className="ai-orb" style={{ width: 24, height: 24 }} />
                <div>
                  <div className="chat-ai-name">Arova AI</div>
                  <div className="chat-ai-status">● Active</div>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setMessages([{
                  id: 'welcome', role: 'model',
                  text: "Chat cleared. How can I help?",
                }])}
              >
                Clear
              </button>
            </div>

            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
                  {msg.text}
                </div>
              ))}
              {isChatting && (
                <div className="chat-msg chat-msg-agent">
                  <div className="chat-thinking">
                    <div className="dot-pulse">
                      <span /><span /><span />
                    </div>
                    Analyzing...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handleChat(s)}>{s}</button>
              ))}
            </div>

            <div className="chat-input-area">
              <div className="chat-input-row">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Ask about protocols, risk, APY..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isChatting}
                />
                <button
                  className="btn btn-primary btn-sm"
                  style={{ alignSelf: 'flex-end' }}
                  onClick={() => handleChat()}
                  disabled={!chatInput.trim() || isChatting}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
