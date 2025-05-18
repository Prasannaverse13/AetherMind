'use server';

/**
 * @fileOverview A personalized DeFi strategy suggestion AI agent based on user's token holdings and market conditions.
 *
 * - personalizedStrategySuggestions - A function that suggests DeFi strategies.
 * - PersonalizedStrategySuggestionsInput - The input type for the personalizedStrategySuggestions function.
 * - PersonalizedStrategySuggestionsOutput - The return type for the personalizedStrategySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedStrategySuggestionsInputSchema = z.object({
  userTokenHoldings: z
    .string()
    .describe("The user's token holdings in their connected Metamask wallet. Should be in a readable format (e.g., '2.5 ETH, 5000 USDC')."),
  okxDexMarketConditions: z.string().describe('Real-time or simulated market conditions on OKX DEX.'),
});
export type PersonalizedStrategySuggestionsInput = z.infer<typeof PersonalizedStrategySuggestionsInputSchema>;

const PersonalizedStrategySuggestionsOutputSchema = z.object({
  suggestedStrategies: z
    .string()
    .describe('A list of 3-5 suggested DeFi strategies on OKX DEX, personalized to the user. Format as a Markdown numbered list (e.g., "1. **Strategy Name:** Description..."). Include specific examples like token amounts if applicable.'),
  rationale: z
    .string()
    .describe('The rationale behind the suggested strategies, considering the user holdings and market conditions. Format as a Markdown paragraph, possibly using bold text for emphasis.'),
});
export type PersonalizedStrategySuggestionsOutput = z.infer<typeof PersonalizedStrategySuggestionsOutputSchema>;

export async function personalizedStrategySuggestions(input: PersonalizedStrategySuggestionsInput): Promise<PersonalizedStrategySuggestionsOutput> {
  return personalizedStrategySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedStrategySuggestionsPrompt',
  input: {schema: PersonalizedStrategySuggestionsInputSchema},
  output: {schema: PersonalizedStrategySuggestionsOutputSchema},
  prompt: `You are an AI DeFi strategist specializing in personalized investment recommendations based on user holdings and real-time market conditions on OKX DEX.

  Given the following information:
  User Token Holdings: {{{userTokenHoldings}}}
  OKX DEX Market Conditions: {{{okxDexMarketConditions}}}

  Please provide:
  1.  **Suggested Strategies**: A list of 3-5 specific DeFi strategies suitable for the user on OKX DEX. For each strategy, briefly explain it and, where appropriate, suggest example allocations based on their holdings (e.g., "Allocate X amount of Y token..."). Format this as a Markdown numbered list.
  2.  **Rationale**: A concise explanation for why these strategies are being recommended, considering their portfolio, the market conditions, potential yield, risk (impermanent loss, liquidation risk), and gas fees. Format this as a Markdown paragraph.

  Prioritize strategies that align with the user's existing assets and the provided market conditions.
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
