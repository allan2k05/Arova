'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '../components/AppShell';

const PROTOCOLS = [
  { id: 'aave-v3',     name: 'Aave v3',     subgraphId: 'JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk', schema: 'messari', icon: '⚡' },
  { id: 'compound-v3', name: 'Compound v3', subgraphId: 'AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9', schema: 'messari', icon: '🏛️' },
  { id: 'uniswap-v3',  name: 'Uniswap v3',  subgraphId: '5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV', schema: 'official', icon: '🦄' },
  { id: 'balancer-v2', name: 'Balancer v2', subgraphId: '794H6CNzdGF5YfBK9nPsUgGn7EBbdJSCTjgcKPEPyFnn', schema: 'messari', icon: '⚖️' },
];

const QUERY_TEMPLATES: Record<string, { label: string; query: string }[]> = {
  messari: [
    {
      label: 'Protocol Overview',
      query: `{
  lendingProtocols(first: 1) {
    id
    name
    totalValueLockedUSD
    totalDepositBalanceUSD
    totalBorrowBalanceUSD
    cumulativeTotalRevenueUSD
  }
}`,
    },
    {
      label: 'Recent Market Snapshots',
      query: `{
  marketDailySnapshots(
    first: 7
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    timestamp
    totalValueLockedUSD
    dailySupplySideRevenueUSD
    dailyProtocolSideRevenueUSD
    rates { rate side }
  }
}`,
    },
    {
      label: 'Financial Daily Snapshots',
      query: `{
  financialsDailySnapshots(
    first: 7
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    timestamp
    totalValueLockedUSD
    dailyVolumeUSD
    dailyTotalRevenueUSD
    dailySupplySideRevenueUSD
  }
}`,
    },
  ],
  official: [
    {
      label: 'Factory Overview',
      query: `{
  factories(first: 1) {
    id
    poolCount
    txCount
    totalVolumeUSD
    totalValueLockedUSD
    feesUSD
  }
}`,
    },
    {
      label: 'Top Pools by TVL',
      query: `{
  pools(
    first: 10
    orderBy: totalValueLockedUSD
    orderDirection: desc
  ) {
    id
    token0 { symbol }
    token1 { symbol }
    feeTier
    totalValueLockedUSD
    volumeUSD
  }
}`,
    },
    {
      label: 'Recent Pool Day Data',
      query: `{
  poolDayDatas(
    first: 7
    orderBy: date
    orderDirection: desc
  ) {
    date
    tvlUSD
    volumeUSD
    feesUSD
    open
    close
  }
}`,
    },
  ],
};

const AI_PROMPTS = [
  'What is the current TVL trend for this protocol?',
  'Explain the revenue split between LPs and the protocol',
  'Are there any unusual APY movements in recent snapshots?',
  'Generate a GraphQL query to get daily volume for the last 30 days',
  'What does the borrowing utilization rate tell us about risk?',
];

function syntaxHighlight(json: string) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"(\w+)":/g, '<span style="color:#60a5fa">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span style="color:#86efac">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span style="color:#fbbf24">$1</span>')
    .replace(/: (true|false|null)/g, ': <span style="color:#f472b6">$1</span>');
}

interface ChatMsg { role: 'user' | 'model'; text: string; id: string }

function CopilotInner() {
  const searchParams  = useSearchParams();
  const defaultId     = searchParams.get('protocol') ?? 'aave-v3';
  const defaultProto  = PROTOCOLS.find(p => p.id === defaultId) ?? PROTOCOLS[0];

  const [selectedProto, setSelectedProto] = useState(defaultProto);
  const [activeTab,  setActiveTab]  = useState<'graphql' | 'ai'>('graphql');

  // GraphQL IDE state
  const [query,      setQuery]      = useState(QUERY_TEMPLATES[defaultProto.schema][0].query);
  const [result,     setResult]     = useState<string>('');
  const [isRunning,  setIsRunning]  = useState(false);
  const [runError,   setRunError]   = useState<string | null>(null);

  // AI Chat state
  const [messages,   setMessages]   = useState<ChatMsg[]>([{
    id: 'welcome', role: 'model',
    text: `I'm your AI copilot for ${defaultProto.name}. Ask me anything about this protocol, its subgraph data, or I can generate GraphQL queries for you.`,
  }]);
  const [chatInput,  setChatInput]  = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const changeProtocol = (p: typeof PROTOCOLS[0]) => {
    setSelectedProto(p);
    setQuery(QUERY_TEMPLATES[p.schema][0].query);
    setResult('');
    setRunError(null);
    setMessages([{
      id: 'welcome', role: 'model',
      text: `Switched to ${p.name}. Ask me anything about this protocol or run a GraphQL query.`,
    }]);
  };

  const runQuery = async () => {
    if (!query.trim() || isRunning) return;
    setIsRunning(true);
    setRunError(null);
    setResult('');
    try {
      const res  = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subgraphId: selectedProto.subgraphId, query }),
      });
      const data = await res.json();
      if (data.error) {
        setRunError(data.error);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      setRunError('Network error executing query');
    }
    setIsRunning(false);
  };

  const handleChat = async (text?: string) => {
    const prompt = (text ?? chatInput).trim();
    if (!prompt || isChatting) return;
    setChatInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: prompt }]);
    setIsChatting(true);
    try {
      const history = messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, text: m.text }));
      const context = `The user is analyzing ${selectedProto.name} (subgraph schema: ${selectedProto.schema}). Current GraphQL result: ${result ? result.slice(0, 800) : 'none yet'}.`;
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `${context}\n\nUser: ${prompt}`, flags: [], history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'model',
        text: data.success ? data.answer : `Error: ${data.error}`,
      }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Network error.' }]);
    }
    setIsChatting(false);
  };

  const templates = QUERY_TEMPLATES[selectedProto.schema];

  return (
    <AppShell>
      <div className="topbar">
        <span className="topbar-breadcrumb">Tools</span>
        <span className="topbar-divider">/</span>
        <span className="topbar-title">AI Copilot & GraphQL IDE</span>
        <div className="topbar-actions">
          {/* Protocol selector */}
          <div style={{ display: 'flex', gap: 6, background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '3px' }}>
            {PROTOCOLS.map(p => (
              <button
                key={p.id}
                className={`btn btn-sm${selectedProto.id === p.id ? ' btn-primary' : ' btn-ghost'}`}
                style={{ padding: '4px 10px', borderRadius: 6 }}
                onClick={() => changeProtocol(p)}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-content" style={{ padding: '20px 28px' }}>
        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          <button className={`tab${activeTab === 'graphql' ? ' active' : ''}`} onClick={() => setActiveTab('graphql')}>
            GraphQL IDE
          </button>
          <button className={`tab${activeTab === 'ai' ? ' active' : ''}`} onClick={() => setActiveTab('ai')}>
            AI Copilot
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="badge badge-blue" style={{ marginRight: 2 }}>
              {selectedProto.schema === 'messari' ? 'Messari Schema' : 'Official Schema'}
            </span>
            <span className="text-xs text-muted font-mono" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedProto.subgraphId.slice(0, 20)}…
            </span>
          </div>
        </div>

        {/* ── GraphQL IDE Tab ── */}
        {activeTab === 'graphql' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: 'calc(100vh - 220px)' }}>
            {/* Left: Editor */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="card-title">Query Editor</span>
                  <span className="badge badge-neutral">{selectedProto.name}</span>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={runQuery}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <span className="scan-loading"><span className="loading-ring" /> Running…</span>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Run Query
                    </>
                  )}
                </button>
              </div>

              {/* Template picker */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {templates.map((t, i) => (
                  <button
                    key={i}
                    className="filter-btn"
                    style={{ fontSize: 11.5 }}
                    onClick={() => setQuery(t.query)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: 'none',
                  outline: 'none',
                  padding: '16px',
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  resize: 'none',
                  lineHeight: 1.7,
                }}
              />
            </div>

            {/* Right: Result */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="card-header">
                <span className="card-title">Response</span>
                {result && (
                  <span className="badge badge-green">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="12"/></svg>
                    200 OK
                  </span>
                )}
                {runError && <span className="badge badge-red">Error</span>}
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {!result && !runError && !isRunning && (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                    Run a query to see the response here
                  </div>
                )}
                {isRunning && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: 13 }}>
                    <span className="loading-ring" style={{ borderTopColor: 'var(--accent)' }} />
                    Executing query against The Graph…
                  </div>
                )}
                {runError && (
                  <div style={{
                    background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 8, padding: 14, color: 'var(--red)', fontSize: 13, fontFamily: 'var(--mono)',
                  }}>
                    {runError}
                  </div>
                )}
                {result && (
                  <pre
                    style={{ fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.7, color: 'var(--text-secondary)' }}
                    dangerouslySetInnerHTML={{ __html: syntaxHighlight(result) }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── AI Copilot Tab ── */}
        {activeTab === 'ai' && (
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div className="card" style={{ height: 'calc(100vh - 240px)', display: 'flex', flexDirection: 'column' }}>
              <div className="chat-panel-header">
                <div className="chat-ai-badge">
                  <div className="ai-orb" />
                  <div>
                    <div className="chat-ai-name">Arova Copilot</div>
                    <div className="chat-ai-status">● Analyzing {selectedProto.name}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setMessages([{
                  id: 'reset', role: 'model',
                  text: `Chat cleared. I'm ready to help with ${selectedProto.name}.`,
                }])}>
                  Clear
                </button>
              </div>

              <div className="chat-messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>{msg.text}</div>
                ))}
                {isChatting && (
                  <div className="chat-msg chat-msg-agent">
                    <div className="chat-thinking">
                      <div className="dot-pulse"><span /><span /><span /></div>
                      Thinking…
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>

              <div className="chat-suggestions">
                {AI_PROMPTS.map((s, i) => (
                  <button key={i} className="suggestion-chip" onClick={() => handleChat(s)}>{s}</button>
                ))}
              </div>

              <div className="chat-input-area">
                <div className="chat-input-row">
                  <textarea
                    rows={1}
                    placeholder={`Ask about ${selectedProto.name}...`}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }}}
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
        )}
      </div>
    </AppShell>
  );
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<div />}>
      <CopilotInner />
    </Suspense>
  );
}
