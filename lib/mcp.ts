// lib/mcp.ts
// Subgraph MCP Client
//
// Connects to The Graph's hosted Subgraph MCP server via SSE.
// This is THE GRAPH PRODUCT COMPOSITION — Standardized Subgraphs + Subgraph MCP.
//
// MCP Tools used:
//   - execute_query_by_subgraph_id  → run live GraphQL queries
//   - search_subgraphs_by_keyword   → discover subgraphs by name
//   - get_schema_by_subgraph_id     → introspect schema
//
// Hosted endpoint: https://subgraphs.mcp.thegraph.com/sse

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const MCP_ENDPOINT = "https://subgraphs.mcp.thegraph.com/sse";

let _mcpClient: Client | null = null;

export async function getMcpClient(): Promise<Client> {
  if (_mcpClient) return _mcpClient;

  const apiKey = process.env.GRAPH_API_KEY;
  if (!apiKey) {
    throw new Error("GRAPH_API_KEY is required for Subgraph MCP");
  }

  const transport = new SSEClientTransport(new URL(MCP_ENDPOINT), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  });

  const client = new Client({
    name: "arova-agent",
    version: "1.0.0",
  });

  await client.connect(transport);
  _mcpClient = client;
  return client;
}

/**
 * Execute a GraphQL query against any subgraph via Subgraph MCP.
 * Used by the LLM reasoning layer for live follow-up lookups.
 */
export async function mcpQuerySubgraph(
  subgraphId: string,
  query: string
): Promise<unknown> {
  const client = await getMcpClient();
  const result = await client.callTool({
    name: "execute_query_by_subgraph_id",
    arguments: {
      subgraphId,
      query,
    },
  });
  return result;
}

/**
 * Search for subgraphs by keyword via Subgraph MCP.
 */
export async function mcpSearchSubgraphs(keyword: string): Promise<unknown> {
  const client = await getMcpClient();
  const result = await client.callTool({
    name: "search_subgraphs_by_keyword",
    arguments: { keyword },
  });
  return result;
}

/**
 * Get the GraphQL schema for a subgraph via Subgraph MCP.
 */
export async function mcpGetSchema(subgraphId: string): Promise<unknown> {
  const client = await getMcpClient();
  const result = await client.callTool({
    name: "get_schema_by_subgraph_id",
    arguments: { subgraphId },
  });
  return result;
}

/**
 * Returns the MCP tools as Gemini function declarations for tool-use.
 */
export function getMcpToolDefinitions() {
  return [
    {
      name: "query_subgraph_live",
      description:
        "Execute a live GraphQL query against any subgraph on The Graph network via Subgraph MCP. Use this to look up current TVL, rates, pool data, or any on-chain metrics to answer a user's follow-up question.",
      parameters: {
        type: "object" as const,
        properties: {
          subgraphId: {
            type: "string",
            description: "The subgraph ID on The Graph decentralized network",
          },
          query: {
            type: "string",
            description: "The GraphQL query to execute",
          },
        },
        required: ["subgraphId", "query"],
      },
    },
    {
      name: "search_subgraphs",
      description:
        "Search for subgraphs on The Graph network by keyword. Use this to find subgraph IDs when the user asks about a protocol you don't have a known ID for.",
      parameters: {
        type: "object" as const,
        properties: {
          keyword: {
            type: "string",
            description: "Search term (e.g. 'Aave', 'Uniswap', 'lending')",
          },
        },
        required: ["keyword"],
      },
    },
  ];
}
