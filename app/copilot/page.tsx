'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '../components/AppShell';

const PROTOCOLS = [
  { id: 'all',         name: 'All Protocols (Unified AI)', subgraphId: 'all', schema: 'messari', icon: '🌐' },
  { id: 'aave-v3',     name: 'Aave v3',     subgraphId: 'JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk', schema: 'messari', icon: '⚡' },
  { id: 'compound-v3', name: 'Compound v3', subgraphId: 'AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9', schema: 'messari', icon: '🏛️' },
  { id: 'uniswap-v3',  name: 'Uniswap v3',  subgraphId: '5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV', schema: 'official', icon: '🦄' },
  { id: 'balancer-v2', name: 'Balancer v2', subgraphId: '794H6CNzdGF5YfBK9nPsUgGn7EBbdJSCTjgcKPEPyFnn', schema: 'messari', icon: '⚖️' },
];

const QUERY_TEMPLATES: Record<string, { label: string; query: string; prompt: string }[]> = {
  messari: [
    {
      label: 'Protocol Overview',
      prompt: 'Show me total TVL and deposit balances',
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
      label: 'Market Snapshots',
      prompt: 'Get market-level TVL and revenue snapshots for the past week',
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
      label: 'Financial Snapshots',
      prompt: 'Fetch financial daily snapshots including volume and revenue',
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
      prompt: 'Query factory pool count and total volume for Uniswap v3',
      query: `{
  factories(first: 1) {
    id
    poolCount
    txCount
    totalVolumeUSD
    totalValueLockedUSD
  }
}`,
    },
    {
      label: 'Top Pools by TVL',
      prompt: 'List top 10 pools sorted by total value locked',
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
      prompt: 'Get daily TVL and volume trends for recent pools',
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
  }
}`,
    },
  ],
};

const AI_PROMPTS = [
  'Compare TVL and APY across Aave, Compound, and Uniswap',
  'Which protocol generated the highest revenue this week?',
  'Explain the risk rating differences between Lending and DEX protocols',
  'What is the total aggregated TVL monitored across all subgraphs?',
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

function buildQueryFromPrompt(promptText: string, schema: string): string {
  const p = promptText.toLowerCase();

  if (schema === 'official') {
    if (p.includes('pool') || p.includes('top')) {
      return `{
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
}`;
    }
    if (p.includes('day') || p.includes('daily') || p.includes('volume') || p.includes('fee')) {
      return `{
  poolDayDatas(
    first: 7
    orderBy: date
    orderDirection: desc
  ) {
    date
    tvlUSD
    volumeUSD
    feesUSD
  }
}`;
    }
    return `{
  factories(first: 1) {
    id
    poolCount
    txCount
    totalVolumeUSD
    totalValueLockedUSD
  }
}`;
  }

  // Messari Standardized Schema
  if (p.includes('revenue') || p.includes('volume') || p.includes('financial') || p.includes('7 day') || p.includes('daily')) {
    return `{
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
}`;
  }

  if (p.includes('market') || p.includes('rate') || p.includes('snapshot') || p.includes('borrow')) {
    return `{
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
  }
}`;
  }

  return `{
  lendingProtocols(first: 1) {
    id
    name
    totalValueLockedUSD
    totalDepositBalanceUSD
    totalBorrowBalanceUSD
    cumulativeTotalRevenueUSD
  }
}`;
}

interface ChatMsg { role: 'user' | 'model'; text: string; id: string }

function CopilotInner() {
  const searchParams  = useSearchParams();
  const defaultId     = searchParams.get('protocol') ?? 'all';
  const defaultProto  = PROTOCOLS.find(p => p.id === defaultId) ?? PROTOCOLS[0];

  const [selectedProto, setSelectedProto] = useState(defaultProto);
  const [activeTab,  setActiveTab]  = useState<'copilot' | 'graphql'>('copilot');

  // Natural Language AI Generator input
  const [nlInput, setNlInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // GraphQL IDE state
  const [query,      setQuery]      = useState(QUERY_TEMPLATES['messari'][0].query);
  const [result,     setResult]     = useState<string>('');
  const [isRunning,  setIsRunning]  = useState(false);
  const [runError,   setRunError]   = useState<string | null>(null);

  // AI Chat state
  const [messages,   setMessages]   = useState<ChatMsg[]>([{
    id: 'welcome', role: 'model',
    text: `⚡ Welcome! I'm your Unified AI DeFi Copilot. Ask me any question across protocols or type a request in the top AI bar to auto-generate GraphQL queries live.`,
  }]);
  const [chatInput,  setChatInput]  = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const changeProtocol = (p: typeof PROTOCOLS[0]) => {
    setSelectedProto(p);
    setQuery(QUERY_TEMPLATES[p.schema === 'official' ? 'official' : 'messari'][0].query);
    setResult('');
    setRunError(null);
    setMessages([{
      id: 'welcome', role: 'model',
      text: p.id === 'all'
        ? `Switched to Unified Cross-Protocol mode. I can compare and analyze all protocols simultaneously.`
        : `Switched context to ${p.name}. Ask me anything about this protocol or inspect its live subgraph schema.`,
    }]);
  };

  const handleGenerateQuery = (userPrompt?: string) => {
    const text = (userPrompt ?? nlInput).trim();
    if (!text) return;
    setIsGenerating(true);

    const generated = buildQueryFromPrompt(text, selectedProto.schema);
    setQuery(generated);
    setActiveTab('graphql');
    setNlInput('');
    setIsGenerating(false);

    // Auto run generated query against API
    runQueryForText(generated);
  };

  const runQueryForText = async (queryText: string) => {
    setIsRunning(true);
    setRunError(null);
    setResult('');

    const targetSubgraphId = selectedProto.id === 'all'
      ? 'JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk'
      : selectedProto.subgraphId;

    try {
      const res  = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subgraphId: targetSubgraphId, query: queryText }),
      });
      const data = await res.json();
      if (data.error) {
        setRunError(data.error);
      } else {
        setResult(JSON.stringify(data, null, 2));
      }
    } catch {
      setRunError('Network error executing query');
    }
    setIsRunning(false);
  };

  const runQuery = () => runQueryForText(query);

  const handleChat = async (text?: string) => {
    const prompt = (text ?? chatInput).trim();
    if (!prompt || isChatting) return;
    setChatInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: prompt }]);
    setIsChatting(true);
    try {
      const history = messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, text: m.text }));
      const context = `Context: Selected Mode = ${selectedProto.name}. Protocol = ${selectedProto.id}. Current GraphQL result: ${result ? result.slice(0, 600) : 'None'}.`;
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `${context}\n\nUser Question: ${prompt}`, flags: [], history }),
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

  const templates = QUERY_TEMPLATES[selectedProto.schema === 'official' ? 'official' : 'messari'];

  return (
    <AppShell>
      <div className="topbar">
        <span className="topbar-breadcrumb">AI Platform</span>
        <span className="topbar-divider">/</span>
        <span className="topbar-title">Copilot & Live GraphQL IDE</span>
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
        {/* Top AI Natural Language Bar */}
        <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%)', borderColor: 'var(--accent-glow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div className="ai-orb" style={{ width: 22, height: 22 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-bright)' }}>
              AI Natural Language to GraphQL Query Generator
            </div>
            <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>
              {selectedProto.name}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="search-input"
              style={{ background: 'var(--bg-void)', border: '1px solid var(--border-subtle)', borderRadius: 8, flex: 1, padding: '10px 14px', fontSize: 13 }}
              placeholder={`Type any request e.g. "Get 7 day revenue for ${selectedProto.name}"...`}
              value={nlInput}
              onChange={e => setNlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleGenerateQuery(); }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleGenerateQuery()}
              disabled={!nlInput.trim() || isGenerating}
            >
              {isGenerating ? 'Generating...' : '✨ Generate Query'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <span className="text-xs text-muted" style={{ alignSelf: 'center', marginRight: 4 }}>Templates:</span>
            {templates.map((t, i) => (
              <button
                key={i}
                className="filter-btn"
                style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => handleGenerateQuery(t.prompt)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs mb-4">
          <button className={`tab${activeTab === 'copilot' ? ' active' : ''}`} onClick={() => setActiveTab('copilot')}>
            🤖 Unified AI Copilot Assistant
          </button>
          <button className={`tab${activeTab === 'graphql' ? ' active' : ''}`} onClick={() => setActiveTab('graphql')}>
            ⚡ Live Subgraph Query Engine ({selectedProto.name})
          </button>
        </div>

        {/* TAB 1: AI Copilot */}
        {activeTab === 'copilot' && (
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            <div className="card" style={{ height: 'calc(100vh - 290px)', display: 'flex', flexDirection: 'column' }}>
              <div className="chat-panel-header">
                <div className="chat-ai-badge">
                  <div className="ai-orb" />
                  <div>
                    <div className="chat-ai-name">Arova Intelligent DeFi Assistant</div>
                    <div className="chat-ai-status">● Connected to Subgraph Studio ({selectedProto.name})</div>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMessages([{
                    id: 'reset', role: 'model',
                    text: `Chat reset. Ready to analyze ${selectedProto.name}.`,
                  }])}
                >
                  Clear Chat
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
                      <div className="dot-pulse"><span /><span /><span /></div>
                      Analyzing cross-subgraph data…
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
                    placeholder={`Ask AI Copilot anything across all protocols...`}
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
                    Send ➔
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Live GraphQL IDE */}
        {activeTab === 'graphql' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: 'calc(100vh - 290px)' }}>
            {/* Left: Query Editor */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="card-title">GraphQL Query Editor</span>
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

              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  background: 'var(--bg-void)',
                  border: 'none',
                  outline: 'none',
                  padding: '16px',
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  color: 'var(--accent-bright)',
                  resize: 'none',
                  lineHeight: 1.7,
                }}
              />
            </div>

            {/* Right: Response Engine */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="card-header">
                <span className="card-title">Live Response JSON</span>
                {result && (
                  <span className="badge badge-green">
                    200 OK
                  </span>
                )}
                {runError && <span className="badge badge-red">Error</span>}
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {!result && !runError && !isRunning && (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                    Click "Run Query" to execute against Subgraph Studio
                  </div>
                )}
                {isRunning && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: 13 }}>
                    <span className="loading-ring" style={{ borderTopColor: 'var(--accent)' }} />
                    Executing live query...
                  </div>
                )}
                {runError && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
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
