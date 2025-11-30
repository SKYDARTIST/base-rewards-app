export interface ScoreBreakdown {
  txScore: number;
  activeDaysScore: number;
  protocolScore: number;
  volumeScore: number;
  recencyScore: number;
  finalScore: number;
}

export interface EstimationResult {
  activityScore: number;
  estimatedRewards: number;
  stats: {
    balance: string;
    txCount: number;
    activeDays: number;
    volumeUSD: number;
    volumeMethod: string;
    protocols: number;
  };
  scoreBreakdown: ScoreBreakdown;
  explanation: string;
  suggestions: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}