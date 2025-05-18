
"use server";
import { explainDefiStrategy, ExplainDefiStrategyInput, ExplainDefiStrategyOutput } from '@/ai/flows/defi-strategy-explanation';
import { personalizedStrategySuggestions, PersonalizedStrategySuggestionsInput, PersonalizedStrategySuggestionsOutput } from '@/ai/flows/personalized-strategy-suggestions';
import type { SimulationResult } from '@/types';

export async function getStrategyExplanation(input: ExplainDefiStrategyInput): Promise<ExplainDefiStrategyOutput | null> {
  try {
    const result = await explainDefiStrategy(input);
    return result;
  } catch (error) {
    console.error("Error fetching strategy explanation:", error);
    // Return a structured error response if needed, or just the string part
    return { explanation: "Failed to load explanation. Please try again." };
  }
}

export async function getPersonalizedSuggestions(input: PersonalizedStrategySuggestionsInput): Promise<PersonalizedStrategySuggestionsOutput | null> {
  try {
    const result = await personalizedStrategySuggestions(input);
    return result;
  } catch (error) {
    console.error("Error fetching personalized suggestions:", error);
    return {
      aiSuggestions: "Failed to load suggestions. Please try again.",
      aiRationale: "Could not generate rationale due to an error."
    };
  }
}

// Mock OKX DEX Market Data
// In a real app, this would involve API calls to OKX DEX SDK/API.
// This function currently returns a string summary for the AI prompt.
// IMPORTANT: This data is MOCKED and for DEMONSTRATION purposes only.
// Real-time integration with OKX DEX is a future development task.
export async function getMockOkxMarketConditions(): Promise<string> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const conditions = [
    "OKX DEX shows high trading volume for ETH/USDC and BTC/USDT pairs. Liquidity is deep.",
    "Current average APY for stablecoin (USDC/USDT) liquidity pools on OKX DEX is around 5-8%. ETH-related pools are showing 10-15% APY.",
    "Flash loan opportunities for arbitrage between OKX DEX and other platforms for various altcoins are being actively monitored; average profit potential is around 0.03-0.07% per transaction, but requires quick execution.",
    "Gas fees on the compatible network (e.g., Ethereum L2s or OKTC) are currently low to moderate.",
    "A new high-yield farm for a recently listed governance token (XYZ Token) just launched on a partner protocol integrated with OKX DEX, offering temporary APYs upwards of 100%, but with higher risk.",
    "Market sentiment is cautiously optimistic. Bitcoin is trading sideways, while some DeFi tokens show upward momentum."
  ];
  // Select a random condition and add general volatility info
  const baseCondition = conditions[Math.floor(Math.random() * conditions.length)];
  const volatilityLevels = ["low", "medium", "high"];
  const currentVolatility = volatilityLevels[Math.floor(Math.random() * volatilityLevels.length)];
  
  return `${baseCondition} Overall market volatility is currently ${currentVolatility}.`;
}
