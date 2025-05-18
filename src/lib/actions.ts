"use server";
import { explainDefiStrategy, ExplainDefiStrategyInput } from '@/ai/flows/defi-strategy-explanation';
import { personalizedStrategySuggestions, PersonalizedStrategySuggestionsInput } from '@/ai/flows/personalized-strategy-suggestions';
import type { SimulationResult } from '@/types';

export async function getStrategyExplanation(input: ExplainDefiStrategyInput): Promise<string | null> {
  try {
    const result = await explainDefiStrategy(input);
    return result.explanation;
  } catch (error) {
    console.error("Error fetching strategy explanation:", error);
    return "Failed to load explanation. Please try again.";
  }
}

export async function getPersonalizedSuggestions(input: PersonalizedStrategySuggestionsInput): Promise<Pick<SimulationResult, 'aiSuggestions' | 'aiRationale'> | null> {
  try {
    const result = await personalizedStrategySuggestions(input);
    return {
      aiSuggestions: result.suggestedStrategies,
      aiRationale: result.rationale,
    };
  } catch (error) {
    console.error("Error fetching personalized suggestions:", error);
    return {
      aiSuggestions: "Failed to load suggestions. Please try again.",
      aiRationale: "Could not generate rationale due to an error."
    };
  }
}

// Mock OKX DEX Market Data
// In a real app, this would involve API calls to OKX DEX SDK/API
// For now, this function returns a string summary for the AI prompt.
export async function getMockOkxMarketConditions(): Promise<string> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const conditions = [
    "OKX DEX shows high trading volume for ETH/USDC and BTC/USDT pairs.",
    "Current APY for ETH-USDC liquidity pool on OKX DEX is 12.5%.",
    "Flash loan opportunities detected for arbitrage between OKX DEX and other platforms for stablecoins, average profit 0.05% per transaction.",
    "Gas fees on the network are currently moderate.",
    "New high-yield farm for OKT token just launched on a partner protocol accessible via OKX DEX."
  ];
  return conditions[Math.floor(Math.random() * conditions.length)] + " Volatility is medium.";
}
