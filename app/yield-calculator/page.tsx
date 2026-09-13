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
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="text-xs text-muted">{label}</span>
        <span className="font-mono text-sm font-bold" style={{ color }}>
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
          background: `linear-gradient(to right, ${color} ${pct}%, var(--border) ${pct}%)`,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

function ResultCard({ label, value, sub, color = 'var(--text-primary)' }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div style={{ border: '1px solid var(--border)', padding: 14, background: 'var(--bg-panel)' }}>
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, color }}>{value}</div>
      {sub && <div className="text-xs text-muted font-mono" style={{ marginTop: 2 }}>{sub}</div>}
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
      const priceRatio = (1 + priceA / 100) / (1 + priceB / 100);
      const ilFactor   = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;
      const ilLoss     = capital * Math.abs(ilFactor);

      const holdValue  = capital * ((1 + priceA / 100 + 1 + priceB / 100) / 2);
      const feeEarned  = capital * (feeApy / 100) * fraction;
      const lpValue    = capital * (1 + priceA / 100) * (1 + priceB / 100) + feeEarned;
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
        <span className="topbar-title">Yield calculator</span>
        <div className="topbar-actions">
          <button
            className={`btn btn-sm ${mode === 'lp' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('lp')}
          >
            LP / IL calculator
          </button>
          <button
            className={`btn btn-sm ${mode === 'lending' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('lending')}
          >
            Lending yield
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">
            {mode === 'lp' ? 'LP & impermanent loss calculator' : 'Lending yield calculator'}
          </h1>
          <p className="page-subtitle">
            {mode === 'lp'
              ? 'Simulate your LP position returns and impermanent loss exposure for any price movement scenario.'
              : 'Estimate your lending returns across different APY rates and holding periods.'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left: Sliders */}
          <div className="card">
            <div className="card-header"><span className="card-title">Position parameters</span></div>
            <Slider label="Initial capital" value={capital} min={100} max={100000} step={100} unit="$" onChange={setCapital} color="var(--accent)" />
            <Slider label="Holding period" value={days} min={1} max={365} step={1} unit=" days" onChange={setDays} color="var(--accent)" />

            {mode === 'lp' ? (
              <>
                <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />
                <Slider label="Token A price change" value={priceA} min={-90} max={500} step={1} unit="%" onChange={setPriceA} color={priceA >= 0 ? 'var(--severity-none)' : 'var(--severity-high)'} />
                <Slider label="Token B price change" value={priceB} min={-90} max={500} step={1} unit="%" onChange={setPriceB} color={priceB >= 0 ? 'var(--severity-none)' : 'var(--severity-high)'} />
                <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />
                <Slider label="Pool fee APR" value={feeApy} min={0} max={100} step={0.1} unit="%" onChange={setFeeApy} color="var(--accent)" />
              </>
            ) : (
              <>
                <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />
                <Slider label="Lending APY" value={lendingApy} min={0} max={30} step={0.1} unit="%" onChange={setLendingApy} color="var(--severity-none)" />
              </>
            )}
          </div>

          {/* Right: Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Summary Card */}
            <div className="card">
              <div className="text-xs text-muted mb-2 font-mono">Net result after {days} days</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                <span className="font-mono" style={{
                  fontSize: 32, fontWeight: 700,
                  color: isProfit ? 'var(--severity-none)' : 'var(--severity-high)',
                }}>
                  {isProfit ? '+' : ''}${Number(results.netPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="font-mono text-sm font-bold" style={{ color: isProfit ? 'var(--severity-none)' : 'var(--severity-high)' }}>
                  ({results.roi}% ROI)
                </span>
              </div>
              <div className="text-xs text-muted font-mono">
                Starting capital: ${capital.toLocaleString()} → Final: ${Number(results.lpValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>

            {/* Metric breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
              {mode === 'lp' ? (
                <>
                  <ResultCard label="HODL value" value={`$${Number(results.holdValue).toLocaleString(undefined,{maximumFractionDigits:0})}`} />
                  <ResultCard label="LP value (after IL)" value={`$${Number(results.lpValue).toLocaleString(undefined,{maximumFractionDigits:0})}`} color={isProfit ? 'var(--severity-none)' : 'var(--severity-high)'} />
                  <ResultCard label="Fee earnings" value={`+$${Number(results.feeEarned).toLocaleString(undefined,{maximumFractionDigits:0})}`} color="var(--accent)" />
                  <ResultCard label="IL cost" value={`-$${Number(results.ilLoss).toLocaleString(undefined,{maximumFractionDigits:0})}`} color="var(--severity-high)" />
                  <ResultCard label="Better strategy" value={results.better} sub={`by $${Number(results.betterDiff).toLocaleString(undefined,{maximumFractionDigits:0})}`} color={results.better === 'LP' ? 'var(--severity-none)' : 'var(--accent)'} />
                </>
              ) : (
                <>
                  <ResultCard label="Starting capital" value={`$${capital.toLocaleString()}`} />
                  <ResultCard label="Interest earned" value={`+$${Number(results.feeEarned).toLocaleString(undefined,{maximumFractionDigits:0})}`} color="var(--severity-none)" />
                  <ResultCard label="Final value" value={`$${Number(results.lpValue).toLocaleString(undefined,{maximumFractionDigits:0})}`} color="var(--accent)" />
                  <ResultCard label="Effective APY" value={`${(Number(results.roi) * (365 / days)).toFixed(1)}%`} color="var(--accent)" />
                </>
              )}
            </div>

            {/* Explanation Box */}
            <div className="card" style={{ padding: 14 }}>
              <div className="text-xs font-mono mb-1" style={{ color: 'var(--accent)' }}>HOW THIS WORKS</div>
              <p className="text-xs text-muted" style={{ lineHeight: 1.5 }}>
                {mode === 'lp'
                  ? 'Impermanent loss formula: IL = 2√k/(1+k) - 1, where k is the relative price ratio of Token A to Token B. Fee income is projected linearly from annual pool APR.'
                  : 'Lending yield is calculated as simple interest: Capital × APY × (Days / 365). Live interest rates fluctuate dynamically on-chain based on market utilization.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
