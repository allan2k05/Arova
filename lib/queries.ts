// lib/queries.ts
// Standardized Query Layer
//
// KEY PRIZE REQUIREMENT: ONE query function per category, used UNMODIFIED
// across ALL protocols in that category. This proves standards leverage.
//
// Lending query: runs identically against Aave v3 AND Compound v3
// DEX query: runs against Balancer v2 (Messari schema) — same fields
// Uniswap v3 uses its official schema (adapted separately)

import { querySubgraph } from "./subgraph";

// ─── Shared Types ────────────────────────────────────────────────────────────

export interface InterestRate {
  rate: string; // BigDecimal as string, e.g. "4.25" = 4.25%
  side: "LENDER" | "BORROWER";
  type: "VARIABLE" | "STABLE" | "FIXED";
}

export interface FinancialsDailySnapshot {
  id: string;
  timestamp: string;
  totalValueLockedUSD: string;
  dailyTotalRevenueUSD: string;
  dailySupplySideRevenueUSD: string;
  dailyProtocolSideRevenueUSD: string;
}

// ─── Lending Types ───────────────────────────────────────────────────────────

export interface LendingMarket {
  id: string;
  name: string;
  totalValueLockedUSD: string;
  totalDepositBalanceUSD: string;
  totalBorrowBalanceUSD: string;
  rates: InterestRate[];
}

export interface LendingProtocolData {
  lendingProtocols: {
    id: string;
    name: string;
    totalValueLockedUSD: string;
    cumulativeTotalRevenueUSD: string;
    cumulativeSupplySideRevenueUSD: string;
  }[];
  financialsDailySnapshots: (FinancialsDailySnapshot & {
    dailyDepositUSD: string;
    dailyBorrowUSD: string;
  })[];
  markets: LendingMarket[];
}

// ─────────────────────────────────────────────────────────────────────────────
// STANDARDIZED LENDING QUERY
// This EXACT query text works unmodified on both Aave v3 and Compound v3.
// Both use the Messari standardized lending schema (schema-lending.graphql).
// ─────────────────────────────────────────────────────────────────────────────
const LENDING_QUERY = /* GraphQL */ `
  query GetLendingProtocolData {
    lendingProtocols(first: 1) {
      id
      name
      totalValueLockedUSD
      cumulativeTotalRevenueUSD
      cumulativeSupplySideRevenueUSD
    }
    financialsDailySnapshots(
      first: 14
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      timestamp
      totalValueLockedUSD
      dailyTotalRevenueUSD
      dailySupplySideRevenueUSD
      dailyProtocolSideRevenueUSD
      dailyDepositUSD
      dailyBorrowUSD
    }
    markets(
      first: 5
      orderBy: totalValueLockedUSD
      orderDirection: desc
    ) {
      id
      name
      totalValueLockedUSD
      totalDepositBalanceUSD
      totalBorrowBalanceUSD
      rates {
        rate
        side
        type
      }
    }
  }
`;

export async function fetchLendingData(
  subgraphId: string
): Promise<LendingProtocolData> {
  return querySubgraph<LendingProtocolData>(subgraphId, LENDING_QUERY);
}

// ─── DEX Types ───────────────────────────────────────────────────────────────

export interface LiquidityPool {
  id: string;
  name: string;
  totalValueLockedUSD: string;
  cumulativeVolumeUSD: string;
}

export interface DexProtocolData {
  dexAmmProtocols: {
    id: string;
    name: string;
    totalValueLockedUSD: string;
    cumulativeVolumeUSD: string;
    cumulativeTotalRevenueUSD: string;
  }[];
  financialsDailySnapshots: (FinancialsDailySnapshot & {
    dailyVolumeUSD: string;
  })[];
  liquidityPools: LiquidityPool[];
}

// ─────────────────────────────────────────────────────────────────────────────
// STANDARDIZED DEX QUERY
// Runs unmodified against Balancer v2 (Messari schema).
// Demonstrates same query pattern across DEX category.
// ─────────────────────────────────────────────────────────────────────────────
const DEX_QUERY = /* GraphQL */ `
  query GetDexProtocolData {
    dexAmmProtocols(first: 1) {
      id
      name
      totalValueLockedUSD
      cumulativeVolumeUSD
      cumulativeTotalRevenueUSD
    }
    financialsDailySnapshots(
      first: 14
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
    liquidityPools(
      first: 5
      orderBy: totalValueLockedUSD
      orderDirection: desc
    ) {
      id
      name
      totalValueLockedUSD
      cumulativeVolumeUSD
    }
  }
`;

export async function fetchDexData(subgraphId: string): Promise<DexProtocolData> {
  return querySubgraph<DexProtocolData>(subgraphId, DEX_QUERY);
}

// ─── Uniswap V3 (Official Schema) ────────────────────────────────────────────
// Uniswap's official subgraph uses its own schema (factories/pools).
// We include it for breadth but note the schema difference clearly.

export interface UniswapData {
  factories: {
    id: string;
    totalValueLockedUSD: string;
    totalVolumeUSD: string;
    feesUSD: string;
  }[];
  poolDayDatas: {
    date: number;
    tvlUSD: string;
    volumeUSD: string;
    feesUSD: string;
  }[];
}

const UNISWAP_QUERY = /* GraphQL */ `
  query GetUniswapData {
    factories(first: 1) {
      id
      totalValueLockedUSD
      totalVolumeUSD
      feesUSD
    }
    poolDayDatas(
      first: 14
      orderBy: date
      orderDirection: desc
      where: { tvlUSD_gt: "1000000" }
    ) {
      date
      tvlUSD
      volumeUSD
      feesUSD
    }
  }
`;

export async function fetchUniswapData(subgraphId: string): Promise<UniswapData> {
  return querySubgraph<UniswapData>(subgraphId, UNISWAP_QUERY);
}
