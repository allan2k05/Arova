'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '../components/AppShell';

const PROTOCOLS = [
  { id: 'all',         name: 'All protocols (Unified AI)', subgraphId: 'all', schema: 'messari' },
  { id: 'aave-v3',     name: 'Aave v3',     subgraphId: 'JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk', schema: 'messari' },
  { id: 'compound-v3', name: 'Compound v3', subgraphId: 'AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9', schema: 'messari' },
  { id: 'uniswap-v3',  name: 'Uniswap v3',  subgraphId: '5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV', schema: 'official' },
  { id: 'balancer-v2', name: 'Balancer v2', subgraphId: '794H6CNzdGF5YfBK9nPsUgGn7EBbdJSCTjgcKPEPyFnn', schema: 'messari' },
];

const QUERY_TEMPLATES: Record<string, { label: string; query: string; prompt: string }[]> = {
  messari: [
    {
      label: 'Protocol overview',
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
      label: 'Market snapshots',
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
      label: 'Financial snapshots',
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
      label: 'Factory overview',
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
      label: 'Top pools by TVL',
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
      label: 'Recent pool day data',
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
    text: `Arova AI assistant connected. Ask questions across protocols or type a request to auto-generate GraphQL queries live.`,
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
        ? `Switched to cross-protocol mode.`
        : `Switched context to ${p.name}. Ask anything about this protocol or inspect its subgraph schema.`,
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
        <span className="topbar-breadcrumb">Tools</span>
        <span className="topbar-divider">/</span>
        <span className="topbar-title">AI copilot & GraphQL IDE</span>
        <div className="topbar-actions">
          {/* Protocol selector */}
          <div style={{ display: 'flex', gap: 4 }}>
            {PROTOCOLS.map(p => (
              <button
                key={p.id}
                className={`btn btn-sm ${selectedProto.id === p.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() => changeProtocol(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Top AI Natural Language Bar */}
        <div className="card mb-4">
          <div className="card-title mb-2">
            AI natural language to GraphQL generator ({selectedProto.name})
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="console-input"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', flex: 1, padding: '8px 12px', fontSize: 13 }}
              placeholder={`Type request e.g. "Get 7 day revenue"...`}
              value={nlInput}
              onChange={e => setNlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleGenerateQuery(); }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleGenerateQuery()}
              disabled={!nlInput.trim() || isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate query'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <span className="text-xs text-muted" style={{ alignSelf: 'center', marginRight: 4 }}>Templates:</span>
            {templates.map((t, i) => (
              <button
                key={i}
                className="btn btn-outline btn-sm"
                style={{ fontSize: 11, padding: '2px 8px' }}
                onClick={() => handleGenerateQuery(t.prompt)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <button className={`btn btn-sm ${activeTab === 'copilot' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('copilot')}>
            AI copilot assistant
          </button>
          <button className={`tab btn btn-sm ${activeTab === 'graphql' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('graphql')}>
            Live GraphQL engine ({selectedProto.name})
          </button>
        </div>

        {/* TAB 1: AI Copilot Console */}
        {activeTab === 'copilot' && (
          <div className="console-panel" style={{ minHeight: 460 }}>
            <div className="console-header">
              <span>Arova AI copilot console</span>
              <span className="text-xs font-mono text-muted">Active: {selectedProto.name}</span>
            </div>

            <div className="console-feed" style={{ height: 380 }}>
              {messages.map(msg => (
                <div key={msg.id} className="console-item">
                  <div className="console-timestamp">{msg.role === 'user' ? '► USER PROMPT' : '✦ AROVA AGENT'}</div>
                  <div className="console-text">{msg.text}</div>
                </div>
              ))}
              {isChatting && (
                <div className="console-item">
                  <div className="console-timestamp">✦ AROVA AGENT</div>
                  <div className="console-text text-muted">Analyzing subgraph data...</div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>

            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AI_PROMPTS.map((s, i) => (
                <button key={i} className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleChat(s)}>
                  {s}
                </button>
              ))}
            </div>

            <div className="console-input-row">
              <input
                className="console-input"
                placeholder="Ask AI copilot question..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }}}
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
        )}

        {/* TAB 2: Live GraphQL IDE */}
        {activeTab === 'graphql' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">GraphQL query editor ({selectedProto.name})</span>
                <button className="btn btn-primary btn-sm" onClick={runQuery} disabled={isRunning}>
                  {isRunning ? 'Running...' : 'Run query'}
                </button>
              </div>

              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%',
                  height: 320,
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                  padding: 12,
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  color: 'var(--accent)',
                  lineHeight: 1.6,
                }}
              />
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Response JSON</span>
                {result && <span style={{ color: 'var(--severity-none)', fontSize: 12, fontFamily: 'var(--mono)' }}>200 OK</span>}
              </div>

              <div style={{ height: 320, overflow: 'auto', background: 'var(--bg-base)', border: '1px solid var(--border)', padding: 12 }}>
                {!result && !runError && !isRunning && (
                  <div className="text-muted text-xs font-mono">Click "Run query" to execute against Subgraph Studio</div>
                )}
                {isRunning && <div className="text-muted text-xs font-mono">Executing live query...</div>}
                {runError && <div style={{ color: 'var(--red)', fontSize: 12, fontFamily: 'var(--mono)' }}>{runError}</div>}
                {result && (
                  <pre style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-primary)' }}>
                    {result}
                  </pre>
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
