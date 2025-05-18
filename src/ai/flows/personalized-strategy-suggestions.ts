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
    .describe("The user's token holdings in their connected Metamask wallet. Should be in a readable format."),
  okxDexMarketConditions: z.string().describe('Real-time market conditions on OKX DEX.'),
});
export type PersonalizedStrategySuggestionsInput = z.infer<typeof PersonalizedStrategySuggestionsInputSchema>;

const PersonalizedStrategySuggestionsOutputSchema = z.object({
  suggestedStrategies: z
    .string()
    .describe('A list of suggested DeFi strategies on OKX DEX, personalized to the user.'),
  rationale: z
    .string()
    .describe('The rationale behind the suggested strategies, considering the user holdings and market conditions.'),
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

  Given the following information, suggest DeFi strategies suitable for the user:

  User Token Holdings: {{{userTokenHoldings}}}
  OKX DEX Market Conditions: {{{okxDexMarketConditions}}}

  Consider factors such as potential yield, risk (impermanent loss, liquidation risk), and gas fees.

  Provide a clear rationale for each suggested strategy.
  `, // Added handlebars templating to include the descriptions in the prompt.
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
