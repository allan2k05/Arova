// lib/signals.ts
// Signal Logic — computes week-over-week deltas and generates plain-English flags.
// All functions are pure — no side effects, easy to unit test.

import type {
  LendingProtocolData,
  DexProtocolData,
  UniswapData,
} from "./queries";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FlagSeverity = "HIGH" | "MEDIUM" | "INFO";

export interface Flag {
  id: string;
  protocolId: string;
  protocolName: string;
  category: "lending" | "dex";
  severity: FlagSeverity;
  title: string;
  description: string;
  metrics: {
    label: string;
    current: string;
    previous: string;
    changePct: string;
  }[];
  rawData: Record<string, unknown>; // passed to LLM for reasoning
  timestamp: number;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  TVL_DROP_HIGH: -10, // % — 🔴 HIGH
  TVL_DROP_MEDIUM: -5, // % — 🟡 MEDIUM
  YIELD_SPIKE_MEDIUM: 20, // % increase — 🟡 MEDIUM
  VOLUME_SURGE_INFO: 50, // % increase — 🟢 INFO
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function usd(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function severityFromTvlDrop(changePct: number): FlagSeverity | null {
  if (changePct <= THRESHOLDS.TVL_DROP_HIGH) return "HIGH";
  if (changePct <= THRESHOLDS.TVL_DROP_MEDIUM) return "MEDIUM";
  return null;
}

// ─── Lending Signal Analysis ──────────────────────────────────────────────────

export function analyzeLending(
  protocolId: string,
  protocolName: string,
  data: LendingProtocolData
): Flag[] {
  const flags: Flag[] = [];
  const snapshots = data.financialsDailySnapshots;

  if (!snapshots || snapshots.length < 7) return flags;

  const latestTVL = parseFloat(snapshots[0].totalValueLockedUSD);
  const weekAgoTVL = parseFloat(snapshots[6].totalValueLockedUSD);
  const tvlChangePct = pct(latestTVL, weekAgoTVL);

  // Flag 1: TVL drop
  const tvlSeverity = severityFromTvlDrop(tvlChangePct);
  if (tvlSeverity) {
    flags.push({
      id: `${protocolId}-tvl-drop-${Date.now()}`,
      protocolId,
      protocolName,
      category: "lending",
      severity: tvlSeverity,
      title: `TVL ${tvlChangePct < 0 ? "Drop" : "Change"} Detected`,
      description: `${protocolName} total value locked has changed ${fmtPct(
        tvlChangePct
      )} over the past 7 days, from ${usd(weekAgoTVL)} to ${usd(latestTVL)}.`,
      metrics: [
        {
          label: "TVL (7 days ago)",
          current: usd(latestTVL),
          previous: usd(weekAgoTVL),
          changePct: fmtPct(tvlChangePct),
        },
      ],
      rawData: {
        protocol: data.lendingProtocols[0],
        recentSnapshots: snapshots.slice(0, 7),
        topMarkets: data.markets.slice(0, 3),
      },
      timestamp: Date.now(),
    });
  }

  // Flag 2: Supply APY spike
  // Get LENDER/VARIABLE rates from top market
  if (data.markets.length > 0) {
    const topMarket = data.markets[0];
    const supplyRates = topMarket.rates.filter(
      (r) => r.side === "LENDER" && (r.type === "VARIABLE" || r.type === "STABLE")
    );
    if (supplyRates.length > 0) {
      const currentRate = parseFloat(supplyRates[0].rate);
      // Compare against 7-day avg from snapshots (proxy via revenue ratio)
      const latestRevenue = parseFloat(snapshots[0].dailySupplySideRevenueUSD);
      const weekAgoRevenue = parseFloat(snapshots[6].dailySupplySideRevenueUSD);
      const revenueChangePct = pct(latestRevenue, weekAgoRevenue);

      if (revenueChangePct >= THRESHOLDS.YIELD_SPIKE_MEDIUM) {
        flags.push({
          id: `${protocolId}-yield-spike-${Date.now()}`,
          protocolId,
          protocolName,
          category: "lending",
          severity: "MEDIUM",
          title: "Supply Revenue Spike",
          description: `${protocolName} daily supply-side revenue increased ${fmtPct(
            revenueChangePct
          )} over 7 days. Current top market supply rate: ${currentRate.toFixed(2)}%.`,
          metrics: [
            {
              label: "Daily Supply Revenue",
              current: usd(latestRevenue),
              previous: usd(weekAgoRevenue),
              changePct: fmtPct(revenueChangePct),
            },
          ],
          rawData: {
            topMarket,
            recentSnapshots: snapshots.slice(0, 7),
          },
          timestamp: Date.now() + 1,
        });
      }
    }
  }

  return flags;
}

// ─── DEX Signal Analysis ─────────────────────────────────────────────────────

export function analyzeDex(
  protocolId: string,
  protocolName: string,
  data: DexProtocolData
): Flag[] {
  const flags: Flag[] = [];
  const snapshots = data.financialsDailySnapshots;

  if (!snapshots || snapshots.length < 7) return flags;

  const latestTVL = parseFloat(snapshots[0].totalValueLockedUSD);
  const weekAgoTVL = parseFloat(snapshots[6].totalValueLockedUSD);
  const tvlChangePct = pct(latestTVL, weekAgoTVL);

  // Flag 1: TVL drop
  const tvlSeverity = severityFromTvlDrop(tvlChangePct);
  if (tvlSeverity) {
    flags.push({
      id: `${protocolId}-tvl-drop-${Date.now()}`,
      protocolId,
      protocolName,
      category: "dex",
      severity: tvlSeverity,
      title: `TVL Drop Detected`,
      description: `${protocolName} TVL dropped ${fmtPct(tvlChangePct)} over 7 days: ${usd(
        weekAgoTVL
      )} → ${usd(latestTVL)}.`,
      metrics: [
        {
          label: "TVL",
          current: usd(latestTVL),
          previous: usd(weekAgoTVL),
          changePct: fmtPct(tvlChangePct),
        },
      ],
      rawData: {
        protocol: data.dexAmmProtocols[0],
        recentSnapshots: snapshots.slice(0, 7),
        topPools: data.liquidityPools.slice(0, 3),
      },
      timestamp: Date.now(),
    });
  }

  // Flag 2: Volume surge (INFO signal)
  const snapshotsWithVol = snapshots.filter(
    (s) => "dailyVolumeUSD" in s
  ) as (typeof snapshots[0] & { dailyVolumeUSD: string })[];

  if (snapshotsWithVol.length >= 7) {
    const latestVol = parseFloat(snapshotsWithVol[0].dailyVolumeUSD);
    const avgPriorVol =
      snapshotsWithVol
        .slice(1, 7)
        .reduce((sum, s) => sum + parseFloat(s.dailyVolumeUSD), 0) / 6;
    const volChangePct = pct(latestVol, avgPriorVol);

    if (volChangePct >= THRESHOLDS.VOLUME_SURGE_INFO) {
      flags.push({
        id: `${protocolId}-vol-surge-${Date.now()}`,
        protocolId,
        protocolName,
        category: "dex",
        severity: "INFO",
        title: "Volume Surge",
        description: `${protocolName} daily volume is ${fmtPct(
          volChangePct
        )} above the 6-day average (${usd(latestVol)} vs ${usd(avgPriorVol)} avg).`,
        metrics: [
          {
            label: "Daily Volume",
            current: usd(latestVol),
            previous: usd(avgPriorVol) + " (6d avg)",
            changePct: fmtPct(volChangePct),
          },
        ],
        rawData: {
          protocol: data.dexAmmProtocols[0],
          recentSnapshots: snapshotsWithVol.slice(0, 7),
        },
        timestamp: Date.now() + 1,
      });
    }
  }

  return flags;
}

// ─── Cross-Category Rotation Signal ──────────────────────────────────────────

export function analyzeRotation(
  lendingFlags: Flag[],
  dexFlags: Flag[]
): Flag[] {
  const lendingTVLDrop = lendingFlags.some(
    (f) => f.title.includes("TVL") && f.severity === "HIGH"
  );
  const dexVolSurge = dexFlags.some((f) => f.title.includes("Volume Surge"));

  if (lendingTVLDrop && dexVolSurge) {
    return [
      {
        id: `rotation-signal-${Date.now()}`,
        protocolId: "cross-category",
        protocolName: "Cross-Category",
        category: "lending", // arbitrary for display
        severity: "HIGH",
        title: "🔄 Capital Rotation Signal",
        description:
          "Lending TVL is dropping sharply while DEX volume is surging — this may indicate capital rotating from passive lending into active DEX trading. Consider rebalancing.",
        metrics: [],
        rawData: {
          lendingFlags: lendingFlags.filter((f) => f.title.includes("TVL")),
          dexFlags: dexFlags.filter((f) => f.title.includes("Volume")),
        },
        timestamp: Date.now(),
      },
    ];
  }

  return [];
}
