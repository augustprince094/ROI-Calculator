'use server';

/**
 * @fileOverview This file contains the Genkit flow for providing smart suggestions
 * to users for optimizing broiler farming practices by recommending feed additives.
 *
 * - getSmartSuggestions - A function that retrieves smart suggestions based on input parameters.
 * - SmartSuggestionsInput - The input type for the getSmartSuggestions function.
 * - SmartSuggestionsOutput - The return type for the getSmartSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdditiveInfoSchema = z.object({
  name: z.string(),
  cost: z.number(),
  fcrImprovement: z.number(),
  inclusionRate: z.number(),
});

const SmartSuggestionsInputSchema = z.object({
  additiveType: z.string().describe('The type of additive currently used.'),
  feedPrice: z.number().describe('The price of the feed in $ per kg.'),
  broilerWeight: z.number().describe('The average weight of the broiler in kg.'),
  mortalityRate: z
    .number()
    .describe('The mortality rate of the broilers as a percentage.'),
  baselineFcr: z
    .number()
    .describe(
      "The user's baseline feed conversion ratio (FCR) without any additive."
    ),
  currentFcr: z
    .number()
    .describe(
      "The user's current feed conversion ratio (FCR) with the selected additive."
    ),

  averageFeedPrice: z
    .number()
    .describe('The average price of feed in the market.'),
  averageBroilerWeight: z
    .number()
    .describe('The average weight of broilers in the market.'),
  averageMortalityRate: z
    .number()
    .describe('The average mortality rate of broilers in the market.'),
  averageFcr: z.number().describe('The average FCR in the market.'),

  allAdditives: z
    .array(AdditiveInfoSchema)
    .describe(
      'A list of all available additives and their properties (cost per kg, FCR improvement percentage, inclusion rate in g/ton).'
    ),
});

export type SmartSuggestionsInput = z.infer<typeof SmartSuggestionsInputSchema>;

const SmartSuggestionsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe(
      'Suggestions for optimizing broiler farming practices by recommending feed additives.'
    ),
});

export type SmartSuggestionsOutput = z.infer<typeof SmartSuggestionsOutputSchema>;

export async function getSmartSuggestions(
  input: SmartSuggestionsInput
): Promise<SmartSuggestionsOutput> {
  return smartSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartSuggestionsPrompt',
  input: {schema: SmartSuggestionsInputSchema},
  output: {schema: SmartSuggestionsOutputSchema},
  prompt: `You are an expert in broiler farming practices and feed additives. Your goal is to help farmers improve their profitability by recommending the best feed additive strategy.
You will receive the farmer's current metrics, their baseline FCR (without any additives), and a list of all available additives with their properties (cost, FCR improvement, inclusion rate).
Analyze the provided data. Compare the farmer's current performance with what could be achieved with other additives or even a strategic blend of additives.
Your suggestions should be actionable and focus on which additive or blend of additives would provide the best Return on Investment (ROI) or the lowest cost per kg of live weight.
Explain your reasoning. For example, if you recommend 'Additive B', explain why it's better than the current '{{additiveType}}' (e.g., 'Although Additive B is more expensive, its superior FCR improvement of 5% results in greater overall feed savings and a higher ROI.').
Consider the possibility of blending additives if it could yield a synergistic effect, but clearly state that this is a theoretical suggestion and should be tested on a small scale first.

Here is the data:
Farmer's Baseline FCR: {{{baselineFcr}}}
Farmer's Current Metrics (with {{{additiveType}}}):
- Current FCR: {{{currentFcr}}}
- Feed Price: {{{feedPrice}}} $/kg
- Broiler Weight: {{{broilerWeight}}} kg
- Mortality Rate: {{{mortalityRate}}} %

Available Additives:
{{#each allAdditives}}
- {{name}}:
  - Cost: {{cost}} $/kg
  - FCR Improvement: {{fcrImprovement}}%
  - Inclusion Rate: {{inclusionRate}} g/ton
{{/each}}

Market Averages (for context only):
- Average FCR: {{{averageFcr}}}
- Average Feed Price: {{{averageFeedPrice}}}
- Average Broiler Weight: {{{averageBroilerWeight}}}
- Average Mortality Rate: {{{averageMortalityRate}}}

Based on this, what is your recommendation?
Suggestions:`,
});

const smartSuggestionsFlow = ai.defineFlow(
  {
    name: 'smartSuggestionsFlow',
    inputSchema: SmartSuggestionsInputSchema,
    outputSchema: SmartSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
