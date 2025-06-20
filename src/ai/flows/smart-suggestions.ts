'use server';

/**
 * @fileOverview This file contains the Genkit flow for providing smart suggestions
 * to users for optimizing broiler farming practices.
 *
 * - getSmartSuggestions - A function that retrieves smart suggestions based on input parameters.
 * - SmartSuggestionsInput - The input type for the getSmartSuggestions function.
 * - SmartSuggestionsOutput - The return type for the getSmartSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartSuggestionsInputSchema = z.object({
  feedPrice: z.number().describe('The price of the feed in $ per kg.'),
  additiveCost: z.number().describe('The cost of the feed additive in $ per kg.'),
  broilerWeight: z.number().describe('The average weight of the broiler in kg.'),
  mortalityRate: z
    .number()
    .describe('The mortality rate of the broilers as a percentage.'),
  averageFeedPrice: z.number().describe('The average price of feed in the market'),
  averageAdditiveCost: z
    .number()
    .describe('The average cost of feed additives in the market'),
  averageBroilerWeight: z
    .number()
    .describe('The average weight of broilers in the market'),
  averageMortalityRate: z
    .number()
    .describe('The average mortality rate of broilers in the market'),
});

export type SmartSuggestionsInput = z.infer<typeof SmartSuggestionsInputSchema>;

const SmartSuggestionsOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('Suggestions for optimizing broiler farming practices.'),
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
  prompt: `You are an expert in broiler farming practices. You will receive
  information about the user's current broiler farming metrics, as well as
  average metrics in the market. If the user's metrics deviate more than 5% from
  the average metrics, you will provide suggestions for optimizing their
  broiler farming practices to improve their ROI and cost per kg live weight.

  Feed Price: {{{feedPrice}}}
  Additive Cost: {{{additiveCost}}}
  Broiler Weight: {{{broilerWeight}}}
  Mortality Rate: {{{mortalityRate}}}
  Average Feed Price: {{{averageFeedPrice}}}
  Average Additive Cost: {{{averageAdditiveCost}}}
  Average Broiler Weight: {{{averageBroilerWeight}}}
  Average Mortality Rate: {{{averageMortalityRate}}}

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
