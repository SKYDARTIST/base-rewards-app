import { ScoreBreakdown } from "../types";

// Constants for simulation
const POOL_SIZE = 1_000_000_000; // 1 Billion BASE simulation pool

// REALISTIC AIRDROP MAPPING
// Based on typical L2 airdrops (e.g. Arbitrum max was ~10k tokens).
// 1.0 score -> ~12,000 tokens (0.0012%)
// 0.75 score -> ~4,500 tokens
// 0.50 score -> ~1,500 tokens
// 0.25 score -> ~200 tokens
const MAPPING_POINTS = [
  { score: 0.00, pct: 0.0000000 },
  { score: 0.25, pct: 0.0000002 }, // 0.00002% -> 200 tokens
  { score: 0.50, pct: 0.0000015 }, // 0.00015% -> 1,500 tokens
  { score: 0.75, pct: 0.0000045 }, // 0.00045% -> 4,500 tokens
  { score: 1.00, pct: 0.0000120 }, // 0.00120% -> 12,000 tokens
];

export const computeScores = (
  txCount: number,
  activeDays: number,
  protocols: number,
  volumeUSD: number,
  recencyDays: number = 2 // Default assumption if unknown
): ScoreBreakdown => {
  
  // 1. Transaction Score: Logarithmic scale (0 to 1000 txs)
  // log10(tx+1) / 3 -> 1000 txs = 1.0
  const txScore = Math.min(Math.log10(txCount + 1) / 3, 1);

  // 2. Active Days Score: Linear scale
  // Denominator set to 365 to reward full year of daily activity.
  // This prevents users with ~400 days from capping instantly.
  const activeDaysScore = Math.min(activeDays / 365, 1);

  // 3. Protocol Score: Linear scale (0 to 8 protocols)
  const protocolScore = Math.min(protocols / 8, 1);

  // 4. Volume Score: Logarithmic scale
  // Denominator 5.8 to align score distribution with expected volume ranges ($100k-$1M)
  const volumeScore = Math.min(Math.log10(volumeUSD + 1) / 5.8, 1);

  // 5. Recency Score: 1 if < 7 days, decays over 3 months
  const recencyScore = recencyDays <= 7 ? 1 : Math.max(0, 1 - (recencyDays - 7) / 83);

  // Weighted Sum
  // Adjusted: Txs 35%, Active 25%, Proto 20%, Vol 15%, Recency 5%
  const finalScore = 
    (txScore * 0.35) + 
    (activeDaysScore * 0.25) + 
    (protocolScore * 0.20) + 
    (volumeScore * 0.15) + 
    (recencyScore * 0.05);

  return {
    txScore: parseFloat(txScore.toFixed(2)),
    activeDaysScore: parseFloat(activeDaysScore.toFixed(2)),
    protocolScore: parseFloat(protocolScore.toFixed(2)),
    volumeScore: parseFloat(volumeScore.toFixed(2)),
    recencyScore: parseFloat(recencyScore.toFixed(2)),
    finalScore: parseFloat(finalScore.toFixed(3))
  };
};

export const mapScoreToRewards = (score: number): number => {
  if (score <= 0) return 0;
  
  // Find the range the score falls into
  for (let i = 0; i < MAPPING_POINTS.length - 1; i++) {
    const p1 = MAPPING_POINTS[i];
    const p2 = MAPPING_POINTS[i + 1];

    if (score >= p1.score && score <= p2.score) {
      // Linear interpolation
      const t = (score - p1.score) / (p2.score - p1.score);
      const pct = p1.pct + t * (p2.pct - p1.pct);
      return Math.round(POOL_SIZE * pct);
    }
  }

  // Cap at max
  return Math.round(POOL_SIZE * MAPPING_POINTS[MAPPING_POINTS.length - 1].pct);
};