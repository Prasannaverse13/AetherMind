
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
    .describe('A list of 3-5 suggested DeFi strategies on OKX DEX or X Layer, personalized to the user. Format as an HTML ordered list (e.g., "<ol><li><strong>Strategy Name:</strong> Description...</li></ol>"). Include specific examples like token amounts if applicable.'),
  rationale: z
    .string()
    .describe('The rationale behind the suggested strategies, considering the user holdings, market conditions, and risk profile. Format as HTML paragraphs using `<p>` tags, possibly using `<strong>` for emphasis. Ensure it is a valid HTML string.'),
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
  1.  **Suggested Strategies**: A list of 3-5 specific DeFi strategies suitable for the user. Prioritize strategies on OKX's L2, X Layer, where applicable, highlighting the benefits of lower gas fees and faster execution. Also include strategies for OKX DEX on other mainnets if relevant. For each strategy, briefly explain it and, where appropriate, suggest example allocations based on their holdings (e.g., "Allocate X amount of Y token..."). If any strategy involves token swaps, mention the possibility of using a service like 0x.org to find gasless swap quotes, which could reduce transaction costs. Highlight this benefit using <strong> tags. For example: "For token swaps involved in this strategy, <strong>you could look into gasless swap quotes via 0x.org</strong> to potentially save on fees. Remember this provides a quote; actual gasless execution is a more involved process." Format this as an HTML ordered list (e.g., "<ol><li><strong>Strategy Name on X Layer:</strong> Description...</li></ol>").
  2.  **Rationale**: A concise explanation for why these strategies are being recommended, considering their portfolio, the market conditions, potential yield, risk (impermanent loss, liquidation risk), gas fees, {{#if riskProfile}}and importantly, their stated risk profile: '{{{riskProfile}}}'.
      *   If 'conservative', prioritize capital preservation and stable, lower-risk yields (e.g., lending stablecoins, staking well-established assets on X Layer or mainnet).
      *   If 'balanced', suggest a mix of strategies, some for stability and some for moderate growth with acceptable risk.
      *   If 'aggressive', include options with higher potential returns, even if they come with higher volatility or newer protocols (always with clear risk warnings).
      Acknowledge the risk profile in your rationale.{{else}}and general best practices.{{/if}} Format this as HTML, using <p> tags for paragraphs and <strong> for emphasis.

  Prioritize strategies that align with the user's existing assets, the provided market conditions, {{#if riskProfile}}and their selected risk profile.{{else}}and general best practices.{{/if}}
  Ensure your output uses basic HTML tags (e.g. <p>, <strong>, <ul>, <ol>, <li>) for lists, paragraphs, and bolding to improve readability. Do not output raw Markdown.
  Example for a suggested strategy list item: "<li><strong>ETH Staking on X Layer Pool:</strong> Stake a portion of your ETH (e.g., 1 ETH) on a protocol on X Layer to earn steady returns with lower transaction fees...</li>"
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
 