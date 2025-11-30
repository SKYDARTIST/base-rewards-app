import React, { useMemo } from 'react';
import { EstimationResult } from '../types';
import { ScoreGauge } from './ScoreGauge';

interface ResultCardProps {
  result: EstimationResult;
  onReset: () => void;
}

/* StatBox and BreakdownRow keep unchanged */
const StatBox = ({ label, value, sub, tooltip }: { label: string; value: string | number; sub?: string; tooltip?: string }) => (
  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-col items-center justify-center text-center group relative cursor-default">
    <div className="text-gray-500 text-xs uppercase font-semibold tracking-wider mb-1">{label}</div>
    <div className="text-gray-900 font-bold text-lg">{value}</div>
    {sub && <div className="text-gray-400 text-[10px] mt-1 truncate w-full px-1">{sub}</div>}
    {tooltip && (
      <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-2 z-10 shadow-lg pointer-events-none">
        {tooltip}
        <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-gray-800"></div>
      </div>
    )}
  </div>
);

const BreakdownRow = ({ label, score, weight }: { label: string; score: number; weight: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
    <div className="flex flex-col">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="text-xs text-gray-400">Weight: {weight}</span>
    </div>
    <div className="flex items-center">
      <div className="w-24 h-2 bg-gray-100 rounded-full mr-3 overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-full" 
          style={{ width: `${score * 100}%` }}
        ></div>
      </div>
      <span className="text-sm font-bold text-gray-900">{(score * 100).toFixed(0)}</span>
    </div>
  </div>
);

/* ---------- NEW: helpers to compute active days & volume from raw txs ---------- */

function utcDateString(tsSeconds: number) {
  const d = new Date(tsSeconds * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

/**
 * Determine whether a tx is "meaningful".
 * - skip typical ERC20 approvals
 * - skip gas-only tiny txs or same-from-to dust transfers
 * - allow protocol interactions (if contract detection exists upstream)
 *
 * Expect tx to have structure like:
 * { hash, blockTimestamp, from, to, gasUsd?, input, tokenTransfers?: [{token, amount, usdPriceAtTs}], valueUsd?, value }
 */
function isMeaningfulTx(tx: any, opts = { minGasUsd: 0.1, minValueUsd: 1 }) {
  try {
    // skip approvals by method id
    if (tx.input && typeof tx.input === 'string' && tx.input.startsWith('0x095ea7b3')) return false;

    // skip zero-value internal bookkeeping
    if ((!tx.tokenTransfers || tx.tokenTransfers.length === 0) && (!tx.value || Number(tx.value) === 0) && (!tx.valueUsd)) {
      // but if it has events interacting with known protocol, keep it
      if (!tx.interactsWithProtocol) return false;
    }

    // skip very low gas txs that likely are dust
    if (typeof tx.gasUsd !== 'undefined' && tx.gasUsd < opts.minGasUsd && (!tx.tokenTransfers || tx.tokenTransfers.length === 0)) return false;

    // skip transfers below minValueUsd if price data exists
    if (tx.valueUsd && tx.valueUsd < opts.minValueUsd && (!tx.interactsWithProtocol)) return false;

    // otherwise, count as meaningful
    return true;
  } catch (e) {
    return true; // be permissive if structure is unknown
  }
}

/**
 * Compute unique active UTC dates for wallet from raw tx list
 */
function computeActiveDaysFromTxs(rawTxs: any[] = []) {
  if (!Array.isArray(rawTxs) || rawTxs.length === 0) return 0;
  const days = new Set<string>();
  for (const tx of rawTxs) {
    if (!tx || !tx.blockTimestamp) continue;
    if (!isMeaningfulTx(tx)) continue;
    days.add(utcDateString(tx.blockTimestamp));
  }
  return days.size;
}

/**
 * Compute USD volume from raw txs.
 * Prefer explicit per-transfer USD (tokenTransfers[].usdPriceAtTs or tx.valueUsd).
 * Fall back to native value * recent price if provided as tx.nativeUsd.
 */
function computeVolumeFromTxs(rawTxs: any[] = []) {
  if (!Array.isArray(rawTxs) || rawTxs.length === 0) return 0;
  let total = 0;
  for (const tx of rawTxs) {
    if (!tx || !tx.blockTimestamp) continue;
    if (!isMeaningfulTx(tx)) continue;

    // Prefer explicit tokenTransfers with usd values
    if (Array.isArray(tx.tokenTransfers) && tx.tokenTransfers.length > 0) {
      for (const t of tx.tokenTransfers) {
        if (t.usdPriceAtTs && t.amount) {
          // assume amount already converted to decimal (or handle 1e decimals if present)
          total += Number(t.usdPriceAtTs) * Number(t.amount);
        } else if (t.amount && t.tokenUsdAtTs) {
          total += Number(t.amount) * Number(t.tokenUsdAtTs);
        } else if (t.valueUsd) {
          total += Number(t.valueUsd);
        }
      }
      continue;
    }

    // fallback to tx.valueUsd if present
    if (tx.valueUsd) {
      total += Number(tx.valueUsd);
      continue;
    }

    // fallback to native value (value is wei) if provided and price present
    if (tx.value && tx.nativeUsd) {
      const val = Number(tx.value) / 1e18;
      total += val * Number(tx.nativeUsd);
      continue;
    }

    // last resort: skip if we cannot determine USD value
  }
  return Math.round(total * 100) / 100;
}

/* ---------- END helpers ---------- */

export const ResultCard: React.FC<ResultCardProps> = ({ result, onReset }) => {
  // compute derived values from rawTxs if available, else fallback to provided stats
  const computed = useMemo(() => {
    const raw = (result as any).rawTxs || (result as any).raw_tx_sample || null;
    const activeDaysComputed = raw ? computeActiveDaysFromTxs(raw) : null;
    const volumeComputed = raw ? computeVolumeFromTxs(raw) : null;
    return {
      activeDaysComputed,
      volumeComputed
    };
  }, [result]);

  const displayActiveDays = computed.activeDaysComputed ?? result.stats.activeDays;
  const displayVolumeUSD = computed.volumeComputed ?? result.stats.volumeUSD;
  const volumeMethodText = computed.volumeComputed ? 'Calculated from tx transfers & prices' : result.stats.volumeMethod;
  const activeDaysMethodText = computed.activeDaysComputed ? 'Exact UTC days with meaningful txs' : 'Est. Power Law Model';

  return (
    <div className="p-6 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Wallet Analysis</h2>
        <p className="text-gray-500 text-sm">Simulation based on live data</p>
      </div>

      {/* Main Score Area */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-xl mb-6 border border-gray-100 shadow-sm p-4">
        <div className="w-full md:w-1/2 flex justify-center mb-4 md:mb-0 border-r border-gray-100 md:border-r-0">
          <ScoreGauge score={result.activityScore} />
        </div>
        <div className="w-full md:w-1/2 text-center md:text-left pl-0 md:pl-8">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Simulated Rewards</p>
          <div className="text-4xl font-extrabold text-blue-600 tracking-tight">
            {result.estimatedRewards.toLocaleString()} <span className="text-lg text-blue-400 font-medium">BASE</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 leading-snug">
            If the pool was 1B tokens, your activity score of {result.activityScore.toFixed(2)} would capture this share.
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Assessment
        </h3>
        <p className="text-blue-800 text-sm leading-relaxed">
          {result.explanation}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatBox label="Balance" value={`${result.stats.balance} ETH`} />
        <StatBox label="Tx Count" value={result.stats.txCount} tooltip="Raw transaction count from Base RPC" />
        <StatBox 
          label="Est. Volume" 
          value={`~$${Number(displayVolumeUSD).toLocaleString()}`} 
          sub={volumeMethodText}
          tooltip="Estimated based on parsed token transfers and historical prices"
        />
        <StatBox 
          label="Active Days (Life)" 
          value={`~${displayActiveDays}`} 
          sub={activeDaysMethodText}
          tooltip="Estimated activity lifespan based on transaction count"
        />
        <StatBox label="Protocols" value={`~${result.stats.protocols}`} sub="Est. from Diversity" />
        <StatBox label="Chain" value="Base" />
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8">
        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide">Score Breakdown</h3>
        <div className="space-y-1">
          <BreakdownRow label="Transaction Volume" score={result.scoreBreakdown.txScore} weight="35%" />
          <BreakdownRow label="Active Days" score={result.scoreBreakdown.activeDaysScore} weight="25%" />
          <BreakdownRow label="Protocol Diversity" score={result.scoreBreakdown.protocolScore} weight="20%" />
          <BreakdownRow label="Value Moved" score={result.scoreBreakdown.volumeScore} weight="15%" />
          <BreakdownRow label="Recency" score={result.scoreBreakdown.recencyScore} weight="5%" />
        </div>
      </div>

      {/* Suggestions */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wide">To Improve Your Score</h3>
        <ul className="space-y-3">
          {result.suggestions.map((suggestion, idx) => (
            <li key={idx} className="flex items-start text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-transform hover:scale-[1.01]">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3 -mt-0.5 font-bold text-xs">
                {idx + 1}
              </span>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center border-t border-gray-100 pt-6">
        <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto leading-relaxed">
          Disclaimer: This is a simulation using public on-chain data. Estimates for volume and active days are statistically derived from transaction patterns. Not financial advice.
        </p>
        <button
          onClick={onReset}
          className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors shadow-lg shadow-gray-200"
        >
          Check Another Wallet
        </button>
      </div>
    </div>
  );
};