'use server';
/**
 * @fileOverview An AI agent that suggests initial investigation steps based on the content and severity of a report.
 *
 * - suggestInvestigationSteps - A function that suggests initial investigation steps for a given report.
 * - SuggestInvestigationStepsInput - The input type for the suggestInvestigationSteps function.
 * - SuggestInvestigationStepsOutput - The return type for the suggestInvestigationSteps function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestInvestigationStepsInputSchema = z.object({
  reportContent: z
    .string()
    .describe('The content of the whistleblower report.'),
  riskLevel: z
    .enum(['low', 'medium', 'high'])
    .describe('The assessed risk level of the report.'),
});
export type SuggestInvestigationStepsInput = z.infer<
  typeof SuggestInvestigationStepsInputSchema
>;

const SuggestInvestigationStepsOutputSchema = z.object({
  suggestedSteps: z
    .array(z.string())
    .describe('A list of suggested initial investigation steps.'),
  reasoning: z
    .string()
    .describe('The AI agent reasoning behind the suggested steps.'),
});
export type SuggestInvestigationStepsOutput = z.infer<
  typeof SuggestInvestigationStepsOutputSchema
>;

export async function suggestInvestigationSteps(
  input: SuggestInvestigationStepsInput
): Promise<SuggestInvestigationStepsOutput> {
  return suggestInvestigationStepsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestInvestigationStepsPrompt',
  input: {schema: SuggestInvestigationStepsInputSchema},
  output: {schema: SuggestInvestigationStepsOutputSchema},
  prompt: `You are an AI assistant designed to provide initial investigation steps for whistleblower reports.

  Based on the content of the report and its risk level, suggest a list of initial investigation steps that a case manager should take.
  Also, provide a brief reasoning for each suggested step.

  Report Content: {{{reportContent}}}
  Risk Level: {{{riskLevel}}}

  Ensure that the output is a valid JSON object. The suggestedSteps field should be an array of strings, and the reasoning field should contain the AI's reasoning.
  `,
});

const suggestInvestigationStepsFlow = ai.defineFlow(
  {
    name: 'suggestInvestigationStepsFlow',
    inputSchema: SuggestInvestigationStepsInputSchema,
    outputSchema: SuggestInvestigationStepsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
