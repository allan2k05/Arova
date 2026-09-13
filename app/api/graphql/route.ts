// app/api/graphql/route.ts
// POST /api/graphql — secure proxy to execute user-provided GraphQL queries
// against any subgraph on The Graph Subgraph Studio using GRAPH_API_KEY.

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { subgraphId, query } = await req.json();

    if (!subgraphId || !query) {
      return NextResponse.json({ error: 'Missing subgraphId or query' }, { status: 400 });
    }

    const apiKey = process.env.GRAPH_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GRAPH_API_KEY not configured' }, { status: 500 });
    }

    const endpoint = `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/${subgraphId}`;

    const graphRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!graphRes.ok) {
      const text = await graphRes.text();
      return NextResponse.json(
        { error: `The Graph returned ${graphRes.status}: ${text.slice(0, 400)}` },
        { status: 502 }
      );
    }

    const data = await graphRes.json();

    if (data.errors) {
      return NextResponse.json({ error: data.errors.map((e: { message: string }) => e.message).join('\n') }, { status: 400 });
    }

    return NextResponse.json(data.data ?? data);
  } catch (err) {
    console.error('[/api/graphql]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
