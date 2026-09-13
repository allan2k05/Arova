# AROVA — DeFi Risk Intelligence

AROVA is a proactive AI agent that monitors DeFi lending and DEX protocols in
real time, using one reusable, standardized query pattern across every protocol it
tracks, and surfaces early-warning risk signals in plain English. A built-in AI
Copilot lets you ask natural-language follow-up questions about any signal it flags.

Built for **ETHOnline** — submitted to **The Graph: "Best Use of Composable or
Standardized Graph Products."**

---

## Live demo

- **App:** [add your Vercel URL here]
- **Demo video:** [add your video link here]

---

## The problem

DeFi risk data is scattered across dozens of protocols, each with its own data
shape. Spotting an early warning sign — a sudden TVL drop, an unsustainable yield
spike — usually means manually checking multiple dashboards, one protocol at a
time, with no single tool watching all of them for you.

## What AROVA does

- Continuously monitors a set of lending and DEX protocols (currently: Aave v3,
  Compound v3, Uniswap v3, Balancer v2)
- Runs a live audit that scans each protocol's on-chain data for risk signals,
  ranked by severity (high / medium / info)
- Lets you ask the AI Copilot plain-English questions about any protocol or
  signal — e.g. "why is Compound flagged?" — and get an answer grounded in real,
  live data
- Includes a protocol comparison view and a yield calculator alongside the core
  monitoring dashboard

## Why this satisfies "Composable or Standardized Graph Products"

AROVA composes **two Graph products**:

1. **Standardized Subgraphs** (Messari schema) — lending protocols (Aave,
   Compound) and DEX protocols (Uniswap, Balancer) each expose their data
   through the same shared schema. This means AROVA runs **one query per
   category**, unmodified, across every protocol in that category — it doesn't
   need protocol-specific query logic to add a new lending or DEX protocol.
2. **Subgraph MCP** — powers the natural-language layer, letting the AI Copilot
   translate a plain-English question into the right query against live
   Subgraph data.

**What became easier because of the standard:** without a shared schema, adding
each new protocol would mean writing and maintaining a separate query and a
separate parser for that protocol's specific data shape. With Messari's
standardized schema, adding a fifth lending protocol to AROVA requires no new
query code at all — only a new entry pointing at that protocol's Subgraph ID.

**Live data only:** every number shown in the dashboard is fetched live from
Subgraph Studio at request time — nothing is mocked, cached statically, or
hardcoded.

---

## Architecture

```
User question / scheduled audit
        │
        ▼
Protocol Resolver — maps protocol name → Subgraph ID + category
        │
        ▼
Standardized Query Layer — one query per category (lending / DEX),
        │                   reused unchanged across every protocol in it
        ▼
Subgraph Studio API — live on-chain data (TVL, revenue, yield, etc.)
        │
        ▼
Signal Logic — computes deltas, applies thresholds, generates flags
        │
        ▼
Reasoning Layer (Gemini + Subgraph MCP) — turns flags and raw data into
        │                                  plain-English explanations and
        │                                  answers natural-language follow-ups
        ▼
Frontend (Next.js) — dashboard, risk signals feed, AI Copilot chat,
                      protocol comparison, yield calculator
```

## Tech stack

- **Frontend/Framework:** Next.js
- **Data source:** The Graph — Subgraph Studio, Standardized (Messari) Subgraphs, Subgraph MCP
- **AI/reasoning:** Google Gemini
- **Deployment:** Vercel

---

## Getting started locally

### Prerequisites

- Node.js installed
- A [Subgraph Studio](https://thegraph.com) API key (free tier — sign in with a wallet)
- A [Google AI Studio](https://aistudio.google.com) Gemini API key (free tier)

### Setup

```bash
git clone <this-repo-url>
cd arova-app
npm install
```

Create a `.env.local` file in the project root with:

```
GRAPH_API_KEY=your_subgraph_studio_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Then run:

```bash
npm run dev
```

Visit `http://localhost:3000`.

---

## Submission pool

This project was built under the **Start Fresh** pool. All project-specific code
was written during the ETHOnline hackathon. No pre-existing project-specific code
was reused; only public open-source libraries and standard framework tooling
(Next.js) were used as a starting point.

## AI tool use disclosure

AI assistance (Claude, via Antigravity) was used throughout development for:
- Scaffolding the Next.js app structure and UI components
- Writing and debugging the Standardized Subgraph query layer
- Implementing the signal-detection/threshold logic
- Styling and design system implementation

Decisions made independently: which protocols and categories to monitor, the
overall product concept (proactive cross-protocol risk monitoring rather than a
simple lookup tool), the specific risk signals and thresholds tracked, the
visual/brand direction, and the architecture connecting the standardized query
layer to the reasoning layer.

---

## License

MIT
