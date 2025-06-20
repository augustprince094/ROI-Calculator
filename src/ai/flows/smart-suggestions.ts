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
You will receive the farmer's current metrics, their baseline FCR (without any additives), and a list of all available additives with their properties.
Analyze the provided data to determine which additive or blend of additives offers the best Return on Investment (ROI) or the lowest cost per kg of live weight.
Provide a concise, one-paragraph recommendation explaining your choice. For example, mention why one additive is better than another based on cost vs. FCR improvement.

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

Based on this, provide a short, one-paragraph recommendation.
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
