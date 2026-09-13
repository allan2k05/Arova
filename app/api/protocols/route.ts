// app/api/protocols/route.ts
// GET /api/protocols — Returns list of supported protocols or detailed data by id query param.

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PROTOCOLS_DATA = [
  {
    id: 'aave-v3',
    name: 'Aave v3',
    icon: '⚡',
    color: '#B6509E',
    category: 'Lending',
    chain: 'Ethereum',
    tvl: '$11,840,000,000',
    tvlRaw: 11840000000,
    apy: '4.2%',
    volume24h: '$842,000,000',
    dailyRevenue: '$142,500',
    schema: 'Messari Standardized',
    audited: true,
    auditFirm: 'OpenZeppelin, SigmaPrime',
    risk: 'Low',
    securityScore: 96,
    description: 'Decentralized non-custodial liquidity protocol where users can supply assets as collateral and borrow.',
    subgraphId: 'JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk',
    contracts: [
      { name: 'PoolAddressesProvider', address: '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e', explorer: 'https://etherscan.io/address/0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e' },
      { name: 'AaveOracle', address: '0x54586bE62E3c3580375aE3723C145253020CaCA8', explorer: 'https://etherscan.io/address/0x54586bE62E3c3580375aE3723C145253020CaCA8' },
      { name: 'ACLManager', address: '0xc69D708c00FC55b880112f82c071777084fc6d1a', explorer: 'https://etherscan.io/address/0xc69D708c00FC55b880112f82c071777084fc6d1a' },
    ],
    sampleQuery: `{
  financialsDailySnapshots(first: 5, orderBy: timestamp, orderDirection: desc) {
    id
    timestamp
    totalValueLockedUSD
    protocolControlledValueUSD
    dailySupplySideRevenueUSD
    dailyProtocolSideRevenueUSD
  }
}`
  },
  {
    id: 'compound-v3',
    name: 'Compound v3',
    icon: '🏛️',
    color: '#00D395',
    category: 'Lending',
    chain: 'Ethereum',
    tvl: '$2,410,000,000',
    tvlRaw: 2410000000,
    apy: '3.8%',
    volume24h: '$211,000,000',
    dailyRevenue: '$48,200',
    schema: 'Messari Standardized',
    audited: true,
    auditFirm: 'OpenZeppelin, Trail of Bits',
    risk: 'Low',
    securityScore: 94,
    description: 'Algorithmic, autonomous interest rate protocol allowing users to supply and borrow crypto assets.',
    subgraphId: 'AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9',
    contracts: [
      { name: 'cUSDCv3 Comets', address: '0xc3d688B66703497DAA19211EEdff47f25384cdc3', explorer: 'https://etherscan.io/address/0xc3d688B66703497DAA19211EEdff47f25384cdc3' },
      { name: 'Configurator', address: '0x45939657d1CA34A8FA39A924B71D28Fe8431e581', explorer: 'https://etherscan.io/address/0x45939657d1CA34A8FA39A924B71D28Fe8431e581' },
    ],
    sampleQuery: `{
  markets(first: 5) {
    id
    name
    inputToken { symbol decimals }
    totalValueLockedUSD
    rates { rate type }
  }
}`
  },
  {
    id: 'uniswap-v3',
    name: 'Uniswap v3',
    icon: '🦄',
    color: '#FF007A',
    category: 'DEX',
    chain: 'Ethereum',
    tvl: '$4,920,000,000',
    tvlRaw: 4920000000,
    apy: '12.4%',
    volume24h: '$1,240,000,000',
    dailyRevenue: '$380,000',
    schema: 'Official Standard',
    audited: true,
    auditFirm: 'ABDK, Trail of Bits',
    risk: 'Medium',
    securityScore: 91,
    description: 'Concentrated liquidity AMM enabling capital-efficient trading with customizable fee tiers.',
    subgraphId: '5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV',
    contracts: [
      { name: 'UniswapV3Factory', address: '0x1F98431c8aD98523631AE4a59f267346ea31F984', explorer: 'https://etherscan.io/address/0x1F98431c8aD98523631AE4a59f267346ea31F984' },
      { name: 'SwapRouter02', address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', explorer: 'https://etherscan.io/address/0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' },
    ],
    sampleQuery: `{
  pools(first: 5, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id
    token0 { symbol }
    token1 { symbol }
    feeTier
    liquidity
    totalValueLockedUSD
  }
}`
  },
  {
    id: 'balancer-v2',
    name: 'Balancer v2',
    icon: '⚖️',
    color: '#1982FF',
    category: 'DEX',
    chain: 'Ethereum',
    tvl: '$1,120,000,000',
    tvlRaw: 1120000000,
    apy: '8.1%',
    volume24h: '$98,000,000',
    dailyRevenue: '$29,400',
    schema: 'Messari Standardized',
    audited: true,
    auditFirm: 'Certora, Trail of Bits',
    risk: 'Medium',
    securityScore: 89,
    description: 'Automated portfolio manager and liquidity provider with multi-token weighted pools.',
    subgraphId: '794H6CNzdGF5YfBK9nPsUgGn7EBbdJSCTjgcKPEPyFnn',
    contracts: [
      { name: 'Vault', address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8', explorer: 'https://etherscan.io/address/0xBA12222222228d8Ba445958a75a0704d566BF2C8' },
    ],
    sampleQuery: `{
  liquidityPools(first: 5, orderBy: totalValueLockedUSD, orderDirection: desc) {
    id
    name
    totalValueLockedUSD
    outputTokenSupply
  }
}`
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const protocol = PROTOCOLS_DATA.find(p => p.id === id);
    if (!protocol) {
      return NextResponse.json({ error: 'Protocol not found' }, { status: 404 });
    }
    return NextResponse.json({ protocol });
  }

  return NextResponse.json({
    count: PROTOCOLS_DATA.length,
    protocols: PROTOCOLS_DATA,
  });
}
