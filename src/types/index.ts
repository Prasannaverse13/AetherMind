
export interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  valueUSD?: number; // Real-time price feed is complex
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

export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';

export interface SimulationParams {
  [key: string]: string | number;
  riskProfile?: RiskProfile; // Added for storing in recent simulations
  type?: string; // to distinguish between general AI suggestions and specific strategy simulations
}

export interface SimulationResult {
  strategyName: string;
  potentialProfit?: string;
  potentialLoss?: string;
  estimatedAPY?: string;
  risksInvolved: string[];
  gasFeeEstimation?: string;
  aiExplanation?: string; // Expected to be HTML
  aiSuggestions?: string; // Expected to be HTML
  aiRationale?: string; // Expected to be HTML
}

export interface RecentSimulation extends SimulationResult {
  id: string;
  timestamp: Date;
  inputs: SimulationParams;
}

// Interface for Wallet Hook State
export interface WalletState {
  isConnected: boolean;
  account: string | null;
  balance: TokenBalance[];
  networkName?: string; // Added for displaying network name
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance?: () => Promise<void>; // Added for manual refresh
  loading: boolean;
  error: string | null;
}

