'use client';

import { useState, useRef, useEffect } from 'react';

type FlagSeverity = "HIGH" | "MEDIUM" | "INFO";

interface Flag {
  id: string;
  protocolId: string;
  protocolName: string;
  category: "lending" | "dex";
  severity: FlagSeverity;
  title: string;
  description: string;
  explanation: string;
  metrics: {
    label: string;
    current: string;
    previous: string;
    changePct: string;
  }[];
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

const MONITORED_PROTOCOLS = [
  { id: 'aave-v3', name: 'Aave v3', category: 'lending', chain: 'Ethereum Mainnet', defaultTvl: '$11.8B', icon: '⚡' },
  { id: 'compound-v3', name: 'Compound v3', category: 'lending', chain: 'Ethereum Mainnet', defaultTvl: '$2.4B', icon: '🏛️' },
  { id: 'uniswap-v3', name: 'Uniswap v3', category: 'dex', chain: 'Ethereum Mainnet', defaultTvl: '$4.9B', icon: '🦄' },
  { id: 'balancer-v2', name: 'Balancer v2', category: 'dex', chain: 'Ethereum Mainnet', defaultTvl: '$1.1B', icon: '⚖️' },
];

const QUICK_PROMPTS = [
  "⚡ Why is Aave v3 supply APY fluctuating?",
  "🦄 Explain Uniswap v3 24h volume spike",
  "🏛️ Compare Aave v3 vs Compound v3 risk profile",
  "🔍 Search Balancer v2 protocol parameters via MCP",
];

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HIGH' | 'LENDING' | 'DEX'>('ALL');
  
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'model',
    text: '⚡ AROVA Sentinel operational. Connected to The Graph Subgraph MCP network & Google Gemini Reasoning Core. Click "Run Protocol Audit" to scan live protocols for standardized risk signals.'
  }]);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const activeFlags = results.flatMap(r => r.flags);

  const filteredFlags = activeFlags.filter(flag => {
    if (activeFilter === 'HIGH') return flag.severity === 'HIGH';
    if (activeFilter === 'LENDING') return flag.category === 'lending';
    if (activeFilter === 'DEX') return flag.category === 'dex';
    return true;
  });

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setLastScanned(new Date(data.scannedAt).toLocaleTimeString());
        
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: `🔍 Scan Complete: Audited ${MONITORED_PROTOCOLS.length} protocols across Messari & Standardized Subgraph Schemas. Identified ${data.totalFlags} actionable risk signals.`
        }]);
      } else {
        alert("Scan failed: " + data.error);
      }
    } catch (err) {
      alert("Network error during protocol scan");
    }
    setIsScanning(false);
  };

  const handleChatSubmit = async (textToSend?: string) => {
    const prompt = (textToSend || chatInput).trim();
    if (!prompt || isChatting) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: prompt }]);
    setIsChatting(true);

    try {
      const historyPayload = chatMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          flags: activeFlags,
          history: historyPayload
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'model', 
          text: data.answer 
        }]);
      } else {
        setChatMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'model', 
          text: `⚠️ Agent Error: ${data.error}` 
        }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Network error communicating with Subgraph MCP / Gemini server." 
      }]);
    }
    
    setIsChatting(false);
  };

  const triggerAskAboutFlag = (flag: Flag) => {
    const prompt = `Can you perform a deeper breakdown on the "${flag.title}" flag for ${flag.protocolName}?`;
    handleChatSubmit(prompt);
    chatInputRef.current?.focus();
  };

  return (
    <div className="app-container">
      {/* Background Orbs */}
      <div className="bg-glow-1" />
      <div className="bg-glow-2" />

      {/* Top Navbar */}
      <header className="glass-panel navbar">
        <div className="brand">
          <div className="logo-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2.5">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className="brand-title text-gradient">AROVA</div>
            <div className="brand-subtitle">Proactive DeFi Intelligence Sentinel</div>
          </div>
        </div>

        <div className="status-pills">
          <div className="status-pill">
            <span className="pulse-dot" />
            <span style={{ color: '#ffffff' }}>The Graph Subgraph MCP</span>: Online
          </div>
          <div className="status-pill">
            <span style={{ color: 'var(--neon-purple)' }}>LLM Core</span>: Gemini 2.5 Flash
          </div>
          {lastScanned && (
            <div className="status-pill" style={{ borderColor: 'var(--neon-cyan)' }}>
              Updated: {lastScanned}
            </div>
          )}
          <button 
            className="btn-cyber" 
            onClick={handleScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <div className="scanner-wave">
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span className="wave-bar" />
                <span style={{ marginLeft: 6 }}>Auditing Subgraphs...</span>
              </div>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path d="M12 8v4l3 3" />
                </svg>
                Run Protocol Audit
              </>
            )}
          </button>
        </div>
      </header>

      {/* Top Banner Stats Bar */}
      <section className="stats-banner">
        <div className="glass-panel stat-card">
          <div className="stat-label">
            <span>Monitored Protocols</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div className="stat-value text-gradient-cyan">4 Active</div>
          <div className="stat-subtext">Aave, Compound, Uniswap, Balancer</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">
            <span>Messari Standardized Schema</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--neon-purple)" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>
          </div>
          <div className="stat-value" style={{ color: 'var(--neon-purple)' }}>Unified GraphQL</div>
          <div className="stat-subtext" style={{ color: 'var(--text-secondary)' }}>1 Query across all Lending/DEXs</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">
            <span>Active Risk Signals</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--neon-rose)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          </div>
          <div className="stat-value" style={{ color: activeFlags.length > 0 ? 'var(--neon-rose)' : 'var(--neon-emerald)' }}>
            {activeFlags.length} Signals
          </div>
          <div className="stat-subtext" style={{ color: activeFlags.length > 0 ? 'var(--neon-rose)' : 'var(--neon-emerald)' }}>
            {activeFlags.length > 0 ? `${activeFlags.filter(f => f.severity === 'HIGH').length} High Severity` : 'All Systems Nominal'}
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-label">
            <span>Subgraph MCP Tools</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--neon-emerald)" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <div className="stat-value" style={{ color: 'var(--neon-emerald)' }}>SSE Live Stream</div>
          <div className="stat-subtext">Deep Protocol Tool Execution</div>
        </div>
      </section>

      {/* Main Dashboard Layout */}
      <div className="dashboard-grid">
        {/* Left Column: AI Chat Sentinel */}
        <aside className="glass-panel chat-sentinel">
          <div className="chat-header">
            <div className="ai-avatar">
              <div className="ai-nucleus">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>AROVA AI Sentinel</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>Autonomous Agent Mode</span>
              </div>
            </div>
            <button className="btn-cyber btn-cyber-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setChatMessages([])}>
              Clear
            </button>
          </div>

          <div className="chat-feed">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-agent'}`}>
                <p>{msg.text}</p>
              </div>
            ))}
            {isChatting && (
              <div className="chat-msg chat-msg-agent" style={{ opacity: 0.8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  <div className="scanner-wave">
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                    <span className="wave-bar" />
                  </div>
                  Analyzing Subgraph Schemas & Querying MCP Tools...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="quick-prompts">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button key={idx} className="prompt-chip" onClick={() => handleChatSubmit(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }} className="chat-input-box">
            <div className="chat-input-inner">
              <input
                ref={chatInputRef}
                type="text"
                placeholder="Ask AROVA Sentinel about protocols, TVL, APY or risk..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={isChatting}
              />
              <button 
                type="submit" 
                className="btn-cyber" 
                style={{ padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem' }}
                disabled={!chatInput.trim() || isChatting}
              >
                Send
              </button>
            </div>
          </form>
        </aside>

        {/* Right Column: Protocols & Anomaly Feed */}
        <main className="main-feed">
          {/* Monitored Protocol Overview Grid */}
          <div className="protocols-overview">
            {MONITORED_PROTOCOLS.map((p) => {
              const scannedRes = results.find(r => r.protocolId === p.id);
              const tvlDisplay = scannedRes ? `$${(parseFloat(scannedRes.tvl) / 1e6).toFixed(1)}M` : p.defaultTvl;
              const flagCount = scannedRes ? scannedRes.flags.length : 0;
              
              return (
                <div key={p.id} className="glass-panel glass-panel-interactive protocol-mini-card">
                  <div className="protocol-mini-header">
                    <div className="protocol-icon-title">
                      <span>{p.icon}</span>
                      <span>{p.name}</span>
                    </div>
                    <span className="protocol-type-badge" style={{ color: p.category === 'lending' ? 'var(--neon-purple)' : 'var(--neon-cyan)' }}>
                      {p.category}
                    </span>
                  </div>
                  <div className="protocol-tvl-value">{tvlDisplay}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>{p.chain}</span>
                    <span style={{ 
                      color: flagCount > 0 ? 'var(--neon-rose)' : 'var(--neon-emerald)',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {scannedRes ? `${flagCount} Flags` : 'Standby'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Anomaly Controls & Filter Header */}
          <div className="feed-controls">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Detected Risk Signals</h2>
            <div className="filter-tabs">
              {(['ALL', 'HIGH', 'LENDING', 'DEX'] as const).map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeFilter === tab ? 'active' : ''}`}
                  onClick={() => setActiveFilter(tab)}
                >
                  {tab === 'ALL' ? `All (${activeFlags.length})` : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Anomaly Feed Listing */}
          {results.length === 0 ? (
            <div className="glass-panel empty-hero">
              <div className="empty-icon-ring">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '0.5rem' }}>No Subgraph Audit Conducted</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '1.5rem' }}>
                Click "Run Protocol Audit" above to execute standardized GraphQL queries across Aave, Compound, Uniswap, and Balancer subgraphs.
              </p>
              <button className="btn-cyber" onClick={handleScan} disabled={isScanning}>
                Start Protocol Audit
              </button>
            </div>
          ) : filteredFlags.length === 0 ? (
            <div className="glass-panel empty-hero">
              <div className="empty-icon-ring" style={{ borderColor: 'var(--neon-emerald)', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--neon-emerald)" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.3rem', color: '#ffffff', marginBottom: '0.5rem' }}>No Anomaly Signals for Filter</h3>
              <p style={{ color: 'var(--text-secondary)' }}>All monitored parameters within safe threshold bounds.</p>
            </div>
          ) : (
            filteredFlags.map(flag => (
              <article key={flag.id} className={`glass-panel anomaly-card sev-${flag.severity}`}>
                <div className="anomaly-top">
                  <div className="anomaly-title-group">
                    <span className="proto-tag" style={{
                      background: flag.category === 'lending' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0, 243, 255, 0.2)',
                      color: flag.category === 'lending' ? 'var(--neon-purple)' : 'var(--neon-cyan)'
                    }}>
                      {flag.protocolName}
                    </span>
                    <h3 className="anomaly-title">{flag.title}</h3>
                  </div>
                  <span className={`proto-tag badge-${flag.severity}`}>
                    {flag.severity} SEVERITY
                  </span>
                </div>

                <p className="anomaly-desc">{flag.description}</p>

                <div className="metric-grid">
                  {flag.metrics.map((m, idx) => {
                    const isNeg = m.changePct.startsWith('-');
                    return (
                      <div key={idx} className="metric-cell">
                        <div className="metric-cell-label">{m.label}</div>
                        <div className="metric-cell-val">
                          <span className="val-num">{m.current}</span>
                          <span className={`val-badge ${isNeg ? 'neg' : 'pos'}`}>
                            {m.changePct}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {flag.explanation && (
                  <div className="ai-reasoning-box">
                    <div className="ai-reasoning-header">
                      <div className="ai-reasoning-tag">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        </svg>
                        Gemini AI Sentinel Synthesis
                      </div>
                    </div>
                    <p className="ai-reasoning-text">{flag.explanation}</p>
                    
                    <button className="ask-agent-btn" onClick={() => triggerAskAboutFlag(flag)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Deep Audit with Agent Chat
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
