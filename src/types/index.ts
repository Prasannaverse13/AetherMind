export interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  valueUSD?: number; // Made optional as real-time price feed is complex
  logoUrl?: string;
}

export type DeFiStrategyType = 'yield-farming' | 'flash-loan' | 'liquidity-providing';

export interface DeFiStrategy {
  id: DeFiStrategyType;
  name: string;
  description: string;
  longDescription?: string; // For more detailed explanation
  parameters: Array<{
    id: string;
    label: string;
    type: 'number' | 'select';
    options?: Array<{ value: string; label:string }>;
    placeholder?: string;
    defaultValue?: string | number;
  }>;
  risks: string[];
  okxContext?: string; // How it relates to OKX DEX
}

export interface SimulationParams {
  [key: string]: string | number;
}

export interface SimulationResult {
  strategyName: string;
  potentialProfit?: string;
  potentialLoss?: string;
  estimatedAPY?: string;
  risksInvolved: string[];
  gasFeeEstimation?: string;
  aiExplanation?: string; // Expected to be Markdown
  aiSuggestions?: string; // Expected to be Markdown
  aiRationale?: string; // Expected to be Markdown
}

export interface RecentSimulation extends SimulationResult {
  id: string;
  timestamp: Date;
  inputs: SimulationParams;
}
