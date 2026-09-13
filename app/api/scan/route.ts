// app/api/scan/route.ts
// POST /api/scan — orchestrates the full AROVA pipeline:
//   Protocol Resolver → Standardized Query Layer → Signal Logic → LLM summary

import { NextResponse } from "next/server";
import { PROTOCOLS } from "@/lib/protocols";
import { fetchLendingData, fetchDexData, fetchUniswapData } from "@/lib/queries";
import {
  analyzeLending,
  analyzeDex,
  analyzeRotation,
  type Flag,
} from "@/lib/signals";
import { explainFlag } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const allFlags: Flag[] = [];
    const lendingFlags: Flag[] = [];
    const dexFlags: Flag[] = [];
    const results: {
      protocolId: string;
      protocolName: string;
      category: string;
      tvl: string;
      flags: (Flag & { explanation: string })[];
      error?: string;
    }[] = [];

    // ── Run all protocol queries in parallel ──────────────────────────────
    await Promise.allSettled(
      PROTOCOLS.map(async (protocol) => {
        try {
          let flags: Flag[] = [];
          let tvl = "N/A";

          if (protocol.category === "lending") {
            // STANDARDIZED LENDING QUERY — same function for Aave AND Compound
            const data = await fetchLendingData(protocol.subgraphId);
            flags = analyzeLending(protocol.id, protocol.displayName, data);
            tvl =
              data.lendingProtocols[0]?.totalValueLockedUSD
                ? formatTVL(data.lendingProtocols[0].totalValueLockedUSD)
                : "N/A";
          } else if (protocol.id === "uniswap-v3") {
            // Uniswap — official schema (adapted query)
            const data = await fetchUniswapData(protocol.subgraphId);
            // Convert to pseudo-DexProtocolData for signal logic
            const pseudoDex = buildPseudoDexFromUniswap(data);
            flags = analyzeDex(protocol.id, protocol.displayName, pseudoDex);
            tvl = data.factories[0]?.totalValueLockedUSD
              ? formatTVL(data.factories[0].totalValueLockedUSD)
              : "N/A";
          } else {
            // STANDARDIZED DEX QUERY — same function for Balancer
            const data = await fetchDexData(protocol.subgraphId);
            flags = analyzeDex(protocol.id, protocol.displayName, data);
            tvl =
              data.dexAmmProtocols[0]?.totalValueLockedUSD
                ? formatTVL(data.dexAmmProtocols[0].totalValueLockedUSD)
                : "N/A";
          }

          // ── Annotate each flag with an LLM explanation ──────────────────
          const annotatedFlags = await Promise.all(
            flags.map(async (flag) => {
              let explanation = "";
              try {
                explanation = await explainFlag(flag);
              } catch {
                explanation = flag.description;
              }
              return { ...flag, explanation };
            })
          );

          if (protocol.category === "lending") {
            lendingFlags.push(...flags);
          } else {
            dexFlags.push(...flags);
          }

          allFlags.push(...flags);

          results.push({
            protocolId: protocol.id,
            protocolName: protocol.displayName,
            category: protocol.category,
            tvl,
            flags: annotatedFlags,
          });
        } catch (err) {
          results.push({
            protocolId: protocol.id,
            protocolName: protocol.displayName,
            category: protocol.category,
            tvl: "Error",
            flags: [],
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })
    );

    // ── Cross-category rotation signal ────────────────────────────────────
    const rotationFlags = analyzeRotation(lendingFlags, dexFlags);
    if (rotationFlags.length > 0) {
      const annotated = await Promise.all(
        rotationFlags.map(async (flag) => ({
          ...flag,
          explanation: await explainFlag(flag).catch(() => flag.description),
        }))
      );
      results.push({
        protocolId: "cross-category",
        protocolName: "Cross-Category Analysis",
        category: "lending",
        tvl: "-",
        flags: annotated,
      });
    }

    return NextResponse.json({
      success: true,
      scannedAt: new Date().toISOString(),
      totalFlags: allFlags.length + rotationFlags.length,
      results,
    });
  } catch (err) {
    console.error("[/api/scan] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTVL(raw: string): string {
  const n = parseFloat(raw);
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${(n / 1e3).toFixed(2)}K`;
}

function buildPseudoDexFromUniswap(data: {
  factories: { id: string; totalValueLockedUSD: string; totalVolumeUSD: string; feesUSD: string }[];
  poolDayDatas: { date: number; tvlUSD: string; volumeUSD: string; feesUSD: string }[];
}) {
  return {
    dexAmmProtocols: [
      {
        id: data.factories[0]?.id ?? "uniswap-v3",
        name: "Uniswap V3",
        totalValueLockedUSD: data.factories[0]?.totalValueLockedUSD ?? "0",
        cumulativeVolumeUSD: data.factories[0]?.totalVolumeUSD ?? "0",
        cumulativeTotalRevenueUSD: data.factories[0]?.feesUSD ?? "0",
      },
    ],
    financialsDailySnapshots: data.poolDayDatas.map((d) => ({
      id: String(d.date),
      timestamp: String(d.date),
      totalValueLockedUSD: d.tvlUSD,
      dailyVolumeUSD: d.volumeUSD,
      dailyTotalRevenueUSD: d.feesUSD,
      dailySupplySideRevenueUSD: d.feesUSD,
      dailyProtocolSideRevenueUSD: "0",
    })),
    liquidityPools: [],
  };
}
