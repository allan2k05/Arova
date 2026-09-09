// lib/subgraph.ts
// Subgraph Studio API Client — authenticated fetch wrapper for The Graph gateway

const GRAPH_GATEWAY = "https://gateway.thegraph.com/api";

export interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/**
 * Execute a GraphQL query against any subgraph on The Graph decentralized network.
 * Uses Authorization header with bearer token (recommended over URL-embedded key).
 */
export async function querySubgraph<T = Record<string, unknown>>(
  subgraphId: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const apiKey = process.env.GRAPH_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GRAPH_API_KEY environment variable is not set. " +
        "Get your API key from https://thegraph.com/studio"
    );
  }

  const url = `${GRAPH_GATEWAY}/subgraphs/id/${subgraphId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
    // No caching — we always want live data (required by prize rules)
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Subgraph request failed: ${response.status} ${response.statusText} for subgraph ${subgraphId}`
    );
  }

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors?.length) {
    throw new Error(
      `GraphQL errors for subgraph ${subgraphId}: ${result.errors
        .map((e) => e.message)
        .join(", ")}`
    );
  }

  if (!result.data) {
    throw new Error(`No data returned from subgraph ${subgraphId}`);
  }

  return result.data;
}
