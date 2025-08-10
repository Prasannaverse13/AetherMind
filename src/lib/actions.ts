
"use server";
import { explainDefiStrategy, ExplainDefiStrategyInput, ExplainDefiStrategyOutput } from '@/ai/flows/defi-strategy-explanation';
import { personalizedStrategySuggestions, PersonalizedStrategySuggestionsInput, PersonalizedStrategySuggestionsOutput } from '@/ai/flows/personalized-strategy-suggestions';
import { fetchOkxMarketSummary } from '@/services/okxService';
import type { ZeroExQuoteParams, FetchGaslessQuoteResult } from '@/services/zeroxService';
import { fetchGaslessQuote } from '@/services/zeroxService';

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

export async function getOkxMarketConditions(): Promise<string> {
  try {
    const marketSummary = await fetchOkxMarketSummary();
    return marketSummary;
  } catch (error) {
    console.error("Error fetching market conditions via service:", error);
    return "Failed to retrieve current market conditions. Using fallback mock data: Market is highly volatile. BTC is trending down. DeFi blue chips are stable.";
  }
}

export async function get0xGaslessQuote(params: ZeroExQuoteParams): Promise<FetchGaslessQuoteResult> {
    try {
        const result = await fetchGaslessQuote(params);
        return result;
    } catch (error) {
        console.error("Error in get0xGaslessQuote server action:", error);
        return {
            error: "An unexpected error occurred in the server action.",
        };
    }
}
 