'use server';

/**
 * @fileOverview Explains DeFi strategies using Gemini.
 *
 * - explainDefiStrategy - A function that explains a given DeFi strategy.
 * - ExplainDefiStrategyInput - The input type for the explainDefiStrategy function.
 * - ExplainDefiStrategyOutput - The return type for the explainDefiStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainDefiStrategyInputSchema = z.object({
  strategy: z.string().describe('The DeFi strategy to explain (e.g., yield farming, flash loans).'),
});
export type ExplainDefiStrategyInput = z.infer<typeof ExplainDefiStrategyInputSchema>;

const ExplainDefiStrategyOutputSchema = z.object({
  explanation: z.string().describe('A clear and concise explanation of the DeFi strategy, including mechanics and risks.'),
});
export type ExplainDefiStrategyOutput = z.infer<typeof ExplainDefiStrategyOutputSchema>;

export async function explainDefiStrategy(input: ExplainDefiStrategyInput): Promise<ExplainDefiStrategyOutput> {
  return explainDefiStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainDefiStrategyPrompt',
  input: {schema: ExplainDefiStrategyInputSchema},
  output: {schema: ExplainDefiStrategyOutputSchema},
  prompt: `You are a DeFi expert. Explain the following DeFi strategy to the user, including the mechanics and potential risks involved, so that they can make informed decisions:\n\nStrategy: {{{strategy}}}`,
});

const explainDefiStrategyFlow = ai.defineFlow(
  {
    name: 'explainDefiStrategyFlow',
    inputSchema: ExplainDefiStrategyInputSchema,
    outputSchema: ExplainDefiStrategyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
