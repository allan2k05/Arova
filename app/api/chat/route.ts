// app/api/chat/route.ts
// POST /api/chat — natural language follow-up questions about flags
// Gemini uses Subgraph MCP tools to fetch live data as needed

import { NextRequest, NextResponse } from "next/server";
import { chatWithContext } from "@/lib/llm";
import type { Flag } from "@/lib/signals";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatRequest {
  message: string;
  flags: Flag[];
  history: { role: "user" | "model"; text: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const answer = await chatWithContext(
      body.message,
      body.flags ?? [],
      body.history ?? []
    );

    return NextResponse.json({
      success: true,
      answer,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/chat] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
