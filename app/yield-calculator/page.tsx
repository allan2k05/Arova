'use client';

import { useState, useMemo } from 'react';
import AppShell from '../components/AppShell';

function Slider({
  label, value, min, max, step, unit, onChange, color = 'var(--accent)',
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--mono)', color }}>
          {unit === '$' ? `$${value.toLocaleString()}` : `${value}${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          appearance: 'none',
          height: 4,
          borderRadius: 4,
          background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
      <div className="flex justify-between" style={{ marginTop: 4 }}>
        <span className="text-xs text-muted">{unit === '$' ? `$${min.toLocaleString()}` : `${min}${unit}`}</span>
        <span className="text-xs text-muted">{unit === '$' ? `$${max.toLocaleString()}` : `${max}${unit}`}</span>
      </div>
    </div>
  );
}

function ResultCard({ label, value, sub, color = 'var(--text-primary)', highlight = false }: {
  label: string; value: string; sub?: string; color?: string; highlight?: boolean;
}) {
  return (
    <div
      className="metric-chip"
      style={{
        outline: highlight ? `1px solid ${color}40` : 'none',
        background: highlight ? `${color}10` : undefined,
      }}
    >
      <div className="metric-chip-label">{label}</div>
      <div className="metric-chip-val" style={{ fontSize: 18, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ a, b, labelA, labelB, colorA, colorB }: {
  a: number; b: number; labelA: string; labelB: string; colorA: string; colorB: string;
}) {
  const total = a + b || 1;
  return (
    <div style={{ marginTop: 12 }}>
      <div className="flex justify-between" style={{ marginBottom: 5, fontSize: 11.5, color: 'var(--text-tertiary)' }}>
        <span style={{ color: colorA }}>{labelA}: ${a.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span style={{ color: colorB }}>{labelB}: ${b.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
        <div style={{ flex: a / total, background: colorA, transition: 'flex 0.4s ease' }} />
        <div style={{ flex: b / total, background: colorB, transition: 'flex 0.4s ease' }} />
      </div>
    </div>
  );
}

export default function YieldCalculatorPage() {
  const [capital,   setCapital]   = useState(10000);
  const [priceA,    setPriceA]    = useState(0);    // % change token A
  const [priceB,    setPriceB]    = useState(0);    // % change token B
  const [feeApy,    setFeeApy]    = useState(8);    // pool fee APR %
  const [days,      setDays]      = useState(30);
  const [lendingApy, setLendingApy] = useState(4.2); // lending APY %
  const [mode,      setMode]      = useState<'lp' | 'lending'>('lp');

  const results = useMemo(() => {
    const fraction = days / 365;

    if (mode === 'lp') {
      // Impermanent Loss calculation (Uniswap v3 simple model)
      const priceRatio = (1 + priceA / 100) / (1 + priceB / 100);
      const ilFactor   = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;
      const ilLoss     = capital * Math.abs(ilFactor);

      const holdValue  = capital * ((1 + priceA / 100 + 1 + priceB / 100) / 2);
      const feeEarned  = capital * (feeApy / 100) * fraction;
      const lpValue    = capital * (1 + priceA / 100) * (1 + priceB / 100) + feeEarned;
      // adjust for IL
      const lpAdjusted = lpValue - ilLoss;

      const netPnl     = lpAdjusted - capital;
      const roi        = ((lpAdjusted - capital) / capital) * 100;

      return {
        holdValue:   holdValue.toFixed(2),
        lpValue:     lpAdjusted.toFixed(2),
        ilLoss:      ilLoss.toFixed(2),
        feeEarned:   feeEarned.toFixed(2),
        netPnl:      netPnl.toFixed(2),
        roi:         roi.toFixed(2),
        better:      lpAdjusted > holdValue ? 'LP' : 'HODL',
        betterDiff:  Math.abs(lpAdjusted - holdValue).toFixed(2),
      };
    } else {
      // Simple lending yield
      const interest   = capital * (lendingApy / 100) * fraction;
      const total      = capital + interest;
      const roi        = (interest / capital) * 100;
      return {
        holdValue:  capital.toFixed(2),
        lpValue:    total.toFixed(2),
        ilLoss:     '0.00',
        feeEarned:  interest.toFixed(2),
        netPnl:     interest.toFixed(2),
        roi:        roi.toFixed(2),
        better:     'Lending',
        betterDiff: interest.toFixed(2),
      };
    }
  }, [capital, priceA, priceB, feeApy, days, lendingApy, mode]);

  const isProfit = Number(results.netPnl) >= 0;

  return (
    <AppShell>
      <div className="topbar">
        <span className="topbar-breadcrumb">Tools</span>
        <span className="topbar-divider">/</span>
        <span className="topbar-title">Yield Calculator</span>
        <div className="topbar-actions">
          <button
            className={`btn btn-sm ${mode === 'lp' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setMode('lp')}
          >
            LP / IL Calculator
          </button>
          <button
            className={`btn btn-sm ${mode === 'lending' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setMode('lending')}
          >
            Lending Yield
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">
            {mode === 'lp' ? 'LP & Impermanent Loss Calculator' : 'Lending Yield Calculator'}
          </h1>
          <p className="page-subtitle">
            {mode === 'lp'
              ? 'Simulate your LP position returns and impermanent loss exposure for any price movement scenario.'
              : 'Estimate your lending returns across different APY rates and holding periods.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left: Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Position Parameters</span></div>
              <div className="card-body">
                <Slider label="Initial Capital" value={capital} min={100} max={100000} step={100} unit="$" onChange={setCapital} color="var(--accent)" />
                <Slider label="Holding Period" value={days} min={1} max={365} step={1} unit=" days" onChange={setDays} color="var(--purple)" />

                {mode === 'lp' ? (
                  <>
                    <div className="divider" />
                    <Slider label="Token A Price Change" value={priceA} min={-90} max={500} step={1} unit="%" onChange={setPriceA} color={priceA >= 0 ? 'var(--green)' : 'var(--red)'} />
                    <Slider label="Token B Price Change" value={priceB} min={-90} max={500} step={1} unit="%" onChange={setPriceB} color={priceB >= 0 ? 'var(--green)' : 'var(--red)'} />
                    <div className="divider" />
                    <Slider label="Pool Fee APR" value={feeApy} min={0} max={100} step={0.1} unit="%" onChange={setFeeApy} color="var(--amber)" />
                  </>
                ) : (
                  <>
                    <div className="divider" />
                    <Slider label="Lending APY" value={lendingApy} min={0} max={30} step={0.1} unit="%" onChange={setLendingApy} color="var(--green)" />
                  </>
                )}
              </div>
            </div>

            {mode === 'lp' && (
              <div className="card" style={{ padding: '14px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Price Ratio
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {((1 + priceA / 100) / (1 + priceB / 100)).toFixed(3)}x
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  Token A / Token B relative ratio
                </div>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Summary */}
            <div
              className="card"
              style={{
                padding: '20px',
                borderColor: isProfit ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                background: isProfit ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                Net Result after {days} day{days !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em',
                  color: isProfit ? 'var(--green)' : 'var(--red)',
                }}>
                  {isProfit ? '+' : ''}{Number(results.netPnl) >= 0 ? '+' : ''}${Number(results.netPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className={`badge ${isProfit ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 14 }}>
                  {results.roi}% ROI
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                Starting capital: <strong style={{ color: 'var(--text-secondary)' }}>${capital.toLocaleString()}</strong>
                {' → '}Final: <strong style={{ color: 'var(--text-primary)' }}>${Number(results.lpValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
              </div>
            </div>

            {/* Metric breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 12 }}>
              {mode === 'lp' ? (
                <>
                  <ResultCard label="HODL Value" value={`$${Number(results.holdValue).toLocaleString(undefined,{maximumFractionDigits:0})}`} color="var(--text-primary)" />
                  <ResultCard label="LP Value (after IL)" value={`$${Number(results.lpValue).toLocaleString(undefined,{maximumFractionDigits:0})}`} color={isProfit ? 'var(--green)' : 'var(--red)'} highlight />
                  <ResultCard label="Fee Earnings" value={`+$${Number(results.feeEarned).toLocaleString(undefined,{maximumFractionDigits:0})}`} color="var(--amber)" />
                  <ResultCard label="IL Cost" value={`-$${Number(results.ilLoss).toLocaleString(undefined,{maximumFractionDigits:0})}`} color="var(--red)" />
                  <ResultCard label="Better Strategy" value={results.better} sub={`by $${Number(results.betterDiff).toLocaleString(undefined,{maximumFractionDigits:0})}`} color={results.better === 'LP' ? 'var(--green)' : 'var(--amber)'} highlight />
                </>
              ) : (
                <>
                  <ResultCard label="Starting Capital" value={`$${capital.toLocaleString()}`} />
                  <ResultCard label="Interest Earned" value={`+$${Number(results.feeEarned).toLocaleString(undefined,{maximumFractionDigits:0})}`} color="var(--green)" highlight />
                  <ResultCard label="Final Value" value={`$${Number(results.lpValue).toLocaleString(undefined,{maximumFractionDigits:0})}`} color="var(--accent-bright)" highlight />
                  <ResultCard label="Effective APY" value={`${(Number(results.roi) * (365 / days)).toFixed(1)}%`} color="var(--amber)" />
                </>
              )}
            </div>

            {/* Visual split bar */}
            {mode === 'lp' && (
              <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Return Composition
                </div>
                <MiniBar
                  a={Number(results.feeEarned)}
                  b={Number(results.ilLoss)}
                  labelA="Fee Income"
                  labelB="IL Cost"
                  colorA="var(--amber)"
                  colorB="var(--red)"
                />
              </div>
            )}

            {/* Info box */}
            <div className="ai-box" style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)' }}>
              <div className="ai-box-header" style={{ color: 'var(--accent-bright)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                How this works
              </div>
              <p className="ai-box-text">
                {mode === 'lp'
                  ? 'Impermanent loss is calculated using the standard Uniswap v2/v3 formula: IL = 2√k/(1+k) - 1, where k is the price ratio of Token A to Token B. Fee income is projected linearly from the annualized pool APR. Actual returns depend on pool liquidity concentration and price range.'
                  : 'Lending yield is calculated as simple interest: Capital × APY × (Days/365). In practice, compound interest and variable rate changes may differ. Check the live protocol APY in the AI Copilot or via the Protocol Explorer.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
