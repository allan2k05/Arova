// lib/protocols.ts
// Protocol Resolver — maps each protocol to its Subgraph ID + category
// All IDs verified live on The Graph decentralized network (Sept 2026)

export type Category = "lending" | "dex";

export interface Protocol {
  id: string;
  name: string;
  displayName: string;
  subgraphId: string;
  category: Category;
  schema: "messari" | "official";
  color: string; // for UI badge
}

export const PROTOCOLS: Protocol[] = [
  // ── Lending (Messari Standardized Schema) ─────────────────────────────────
  {
    id: "aave-v3",
    name: "Aave V3",
    displayName: "Aave v3",
    subgraphId: "JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk",
    category: "lending",
    schema: "messari",
    color: "#B6509E",
  },
  {
    id: "compound-v3",
    name: "Compound V3",
    displayName: "Compound v3",
    subgraphId: "AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9",
    category: "lending",
    schema: "messari",
    color: "#00D395",
  },

  // ── DEX ───────────────────────────────────────────────────────────────────
  {
    id: "uniswap-v3",
    name: "Uniswap V3",
    displayName: "Uniswap v3",
    subgraphId: "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
    category: "dex",
    schema: "official", // official Uniswap schema (factories/pools)
    color: "#FF007A",
  },
  {
    id: "balancer-v2",
    name: "Balancer V2",
    displayName: "Balancer v2",
    subgraphId: "794H6CNzdGF5YfBK9nPsUgGn7EBbdJSCTjgcKPEPyFnn",
    category: "dex",
    schema: "messari", // Messari standardized DEX schema
    color: "#1E1E6D",
  },
];

export const PROTOCOLS_BY_ID = Object.fromEntries(
  PROTOCOLS.map((p) => [p.id, p])
);

export const PROTOCOLS_BY_CATEGORY: Record<Category, Protocol[]> = {
  lending: PROTOCOLS.filter((p) => p.category === "lending"),
  dex: PROTOCOLS.filter((p) => p.category === "dex"),
};
