
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
  explanation: z.string().describe('A clear and concise explanation of the DeFi strategy, including mechanics and risks. Format your explanation using basic HTML: use `<h3>` for section titles, `<strong>` for bold text, and `<ul>` or `<ol>` with `<li>` for lists. Paragraphs should be wrapped in `<p>` tags. Example: "<h3>Mechanics</h3><p>Strategy works by...</p><ul><li>Step 1</li></ul>". Do not use Markdown syntax like "###" or "**".'),
});
export type ExplainDefiStrategyOutput = z.infer<typeof ExplainDefiStrategyOutputSchema>;

export async function explainDefiStrategy(input: ExplainDefiStrategyInput): Promise<ExplainDefiStrategyOutput> {
  return explainDefiStrategyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainDefiStrategyPrompt',
  input: {schema: ExplainDefiStrategyInputSchema},
  output: {schema: ExplainDefiStrategyOutputSchema},
  prompt: `You are a DeFi expert. Explain the following DeFi strategy to the user in detail.
  Your explanation should cover:
  1.  **Mechanics**: How does this strategy work? What are the steps involved?
  2.  **Potential Risks**: What are the common risks associated with this strategy (e.g., impermanent loss, smart contract vulnerabilities, liquidation, market volatility)? Explain each risk clearly.
  3.  **Considerations for OKX DEX**: If relevant, how might this strategy apply or differ on OKX DEX?
  4.  **Before Proceeding**: What key things should a user research or consider before engaging in this strategy?

  Present the information in a structured and easy-to-understand manner. Use basic HTML tags for headings (<h3>), lists (<ul>, <ol>, <li>), paragraphs (<p>), and bold text (<strong>) to improve readability. Do not output raw Markdown.

  Strategy: {{{strategy}}}`,
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

