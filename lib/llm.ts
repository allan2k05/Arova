// lib/llm.ts
// Reasoning Layer — Google Gemini 1.5 Flash wrapper
// Turns flags + raw data into plain-English explanations.
// Also handles follow-up chat with Subgraph MCP tool calls.

import {
  GoogleGenerativeAI,
  type FunctionDeclaration,
  type Tool,
} from "@google/generative-ai";
import type { Flag } from "./signals";
import { getMcpToolDefinitions, mcpQuerySubgraph, mcpSearchSubgraphs } from "./mcp";

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (_genAI) return _genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get your key from https://aistudio.google.com"
    );
  }
  _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
}

const SYSTEM_PROMPT = `You are AROVA, a proactive DeFi intelligence agent. You monitor lending protocols (Aave v3, Compound v3) and DEX protocols (Uniswap v3, Balancer v2) using The Graph's standardized subgraphs.

Your role:
1. Explain flagged anomalies clearly and concisely — what happened, why it matters, what it could mean
2. Answer follow-up questions using live on-chain data via the query_subgraph_live tool
3. Connect patterns across lending and DEX categories to spot rotation opportunities

Guidelines:
- Always cite specific numbers from the data (TVL amounts, percentage changes, dates)
- Keep explanations under 150 words unless asked for detail
- When querying live data, use the exact subgraph IDs provided
- Format numbers as: $1.2B, $450M, $2.3K — not raw values
- Be direct — no filler phrases like "certainly!" or "great question!"

Known subgraph IDs:
- Aave v3 Ethereum: JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk
- Compound v3 Ethereum: AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9
- Uniswap v3 Ethereum: 5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
- Balancer v2 Ethereum: 794H6CNzdGF5YfBK9nPsUgGn7EBbdJSCTjgcKPEPyFnn`;

/**
 * Generate a brief plain-English explanation for a single flag.
 * Called during the scan to annotate each flag.
 */
export async function explainFlag(flag: Flag): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `${SYSTEM_PROMPT}

Explain this DeFi flag in 2-3 sentences. Be specific about the numbers:

Flag: ${flag.title}
Protocol: ${flag.protocolName} (${flag.category})
Description: ${flag.description}
Metrics: ${JSON.stringify(flag.metrics, null, 2)}
Raw data summary: ${JSON.stringify(flag.rawData, null, 2).slice(0, 2000)}

Response (2-3 sentences, specific numbers, what it means for DeFi users):`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Chat handler — takes a user question, flag context, and returns a streamed answer.
 * Uses Subgraph MCP tools for live data lookups when needed.
 */
export async function chatWithContext(
  userMessage: string,
  flagContext: Flag[],
  conversationHistory: { role: "user" | "model"; text: string }[]
): Promise<string> {
  const genAI = getGenAI();

  const mcpTools = getMcpToolDefinitions();
  const tools: Tool[] = [
    {
      functionDeclarations: mcpTools as unknown as FunctionDeclaration[],
    },
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    tools,
    systemInstruction: SYSTEM_PROMPT,
  });

  const contextBlock = flagContext.length > 0
    ? `Current flags being analyzed:\n${flagContext
        .map(
          (f) =>
            `- [${f.severity}] ${f.protocolName}: ${f.title} — ${f.description}`
        )
        .join("\n")}`
    : "No flags currently active.";

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: `Context:\n${contextBlock}` }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I have the current DeFi flag context loaded. Ask me anything about these flags or any DeFi protocol data.",
          },
        ],
      },
      ...conversationHistory.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      })),
    ],
  });

  // First model response (may request tool calls)
  let response = await chat.sendMessage(userMessage);
  let candidate = response.response.candidates?.[0];

  // Handle tool calls (Gemini function calling loop)
  while (
    candidate?.content.parts.some((p) => p.functionCall)
  ) {
    const toolResults = [];

    for (const part of candidate.content.parts) {
      if (!part.functionCall) continue;

      const { name, args } = part.functionCall;
      let toolResult: unknown;

      try {
        if (name === "query_subgraph_live") {
          const { subgraphId, query } = args as {
            subgraphId: string;
            query: string;
          };
          toolResult = await mcpQuerySubgraph(subgraphId, query);
        } else if (name === "search_subgraphs") {
          const { keyword } = args as { keyword: string };
          toolResult = await mcpSearchSubgraphs(keyword);
        } else {
          toolResult = { error: `Unknown tool: ${name}` };
        }
      } catch (err) {
        toolResult = {
          error: `Tool call failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }

      toolResults.push({
        functionResponse: {
          name,
          response: { result: JSON.stringify(toolResult) },
        },
      });
    }

    // Send tool results back to model
    response = await chat.sendMessage(toolResults);
    candidate = response.response.candidates?.[0];
  }

  return response.response.text().trim();
}
