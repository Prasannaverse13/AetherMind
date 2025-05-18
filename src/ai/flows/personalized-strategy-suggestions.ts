
'use server';

/**
 * @fileOverview A personalized DeFi strategy suggestion AI agent based on user's token holdings, market conditions, and risk profile.
 *
 * - personalizedStrategySuggestions - A function that suggests DeFi strategies.
 * - PersonalizedStrategySuggestionsInput - The input type for the personalizedStrategySuggestions function.
 * - PersonalizedStrategySuggestionsOutput - The return type for the personalizedStrategySuggestions function.
 */

import {ai} from '@/ai/genkit';
import type { RiskProfile } from '@/types';
import {z} from 'genkit';

const PersonalizedStrategySuggestionsInputSchema = z.object({
  userTokenHoldings: z
    .string()
    .describe("The user's token holdings in their connected Metamask wallet. Should be in a readable format (e.g., '2.5 ETH, 5000 USDC')."),
  okxDexMarketConditions: z.string().describe('Real-time or simulated market conditions on OKX DEX.'),
  riskProfile: z.enum(['conservative', 'balanced', 'aggressive']).optional().describe("The user's selected risk profile. 'conservative' favors low-risk, stable returns. 'balanced' seeks a mix of growth and safety. 'aggressive' targets higher yields with higher risk tolerance."),
});
export type PersonalizedStrategySuggestionsInput = z.infer<typeof PersonalizedStrategySuggestionsInputSchema>;

const PersonalizedStrategySuggestionsOutputSchema = z.object({
  suggestedStrategies: z
    .string()
    .describe('A list of 3-5 suggested DeFi strategies on OKX DEX, personalized to the user. Format as a Markdown numbered list (e.g., "1. **Strategy Name:** Description..."). Include specific examples like token amounts if applicable.'),
  rationale: z
    .string()
    .describe('The rationale behind the suggested strategies, considering the user holdings, market conditions, and risk profile. Format as a Markdown paragraph, possibly using bold text for emphasis.'),
});
export type PersonalizedStrategySuggestionsOutput = z.infer<typeof PersonalizedStrategySuggestionsOutputSchema>;

export async function personalizedStrategySuggestions(input: PersonalizedStrategySuggestionsInput): Promise<PersonalizedStrategySuggestionsOutput> {
  return personalizedStrategySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedStrategySuggestionsPrompt',
  input: {schema: PersonalizedStrategySuggestionsInputSchema},
  output: {schema: PersonalizedStrategySuggestionsOutputSchema},
  prompt: `You are an AI DeFi strategist specializing in personalized investment recommendations based on user holdings, real-time market conditions on OKX DEX, and their risk profile.

  Given the following information:
  User Token Holdings: {{{userTokenHoldings}}}
  OKX DEX Market Conditions: {{{okxDexMarketConditions}}}
  {{#if riskProfile}}User Risk Profile: {{{riskProfile}}}{{/if}}

  Please provide:
  1.  **Suggested Strategies**: A list of 3-5 specific DeFi strategies suitable for the user on OKX DEX. For each strategy, briefly explain it and, where appropriate, suggest example allocations based on their holdings (e.g., "Allocate X amount of Y token..."). Format this as a Markdown numbered list.
  2.  **Rationale**: A concise explanation for why these strategies are being recommended, considering their portfolio, the market conditions, potential yield, risk (impermanent loss, liquidation risk), gas fees, {{#if riskProfile}}and importantly, their stated risk profile: '{{{riskProfile}}}'.
      *   If 'conservative', prioritize capital preservation and stable, lower-risk yields (e.g., lending stablecoins, staking well-established assets).
      *   If 'balanced', suggest a mix of strategies, some for stability and some for moderate growth with acceptable risk.
      *   If 'aggressive', include options with higher potential returns, even if they come with higher volatility or newer protocols (always with clear risk warnings).
      Acknowledge the risk profile in your rationale.{{else}}and general best practices.{{/if}} Format this as a Markdown paragraph.

  Prioritize strategies that align with the user's existing assets, the provided market conditions, {{#if riskProfile}}and their selected risk profile.{{else}}and general best practices.{{/if}}
  Ensure your output uses Markdown for lists and bolding to improve readability.
  Example for a suggested strategy: "1. **ETH Staking on OKX PoolX:** Stake a portion of your ETH (e.g., 1 ETH) in OKX PoolX to earn steady returns. This is generally lower risk..."
  `,
});

const personalizedStrategySuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedStrategySuggestionsFlow',
    inputSchema: PersonalizedStrategySuggestionsInputSchema,
    outputSchema: PersonalizedStrategySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
