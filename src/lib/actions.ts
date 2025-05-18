
"use server";
import { explainDefiStrategy, ExplainDefiStrategyInput, ExplainDefiStrategyOutput } from '@/ai/flows/defi-strategy-explanation';
import { personalizedStrategySuggestions, PersonalizedStrategySuggestionsInput, PersonalizedStrategySuggestionsOutput } from '@/ai/flows/personalized-strategy-suggestions';
import { fetchOkxMarketSummary } from '@/services/okxService'; // Import the new service
import type { SimulationResult } from '@/types';

export async function getStrategyExplanation(input: ExplainDefiStrategyInput): Promise<ExplainDefiStrategyOutput | null> {
  try {
    const result = await explainDefiStrategy(input);
    return result;
  } catch (error) {
    console.error("Error fetching strategy explanation:", error);
    return { explanation: "<p>Failed to load explanation. Please try again.</p>" };
  }
}

export async function getPersonalizedSuggestions(input: PersonalizedStrategySuggestionsInput): Promise<PersonalizedStrategySuggestionsOutput | null> {
  try {
    const result = await personalizedStrategySuggestions(input);
    return result;
  } catch (error) {
    console.error("Error fetching personalized suggestions:", error);
    return {
      suggestedStrategies: "<p>Failed to load suggestions. Please try again.</p>",
      rationale: "<p>Could not generate rationale due to an error.</p>"
    };
  }
}

/**
 * Retrieves market conditions.
 * Previously getMockOkxMarketConditions, now attempts to use the okxService.
 * NOTE: okxService.fetchOkxMarketSummary() currently returns MOCK DATA.
 * Real-time integration with OKX DEX is a future development task.
 */
export async function getOkxMarketConditions(): Promise<string> {
  try {
    // This will call the service, which currently returns mock data.
    // Replace with actual API call implementation in okxService.ts later.
    const marketSummary = await fetchOkxMarketSummary();
    return marketSummary;
  } catch (error) {
    console.error("Error fetching market conditions via service:", error);
    return "Failed to retrieve current market conditions. Using fallback mock data: Market is highly volatile. BTC is trending down. DeFi blue chips are stable.";
  }
}

