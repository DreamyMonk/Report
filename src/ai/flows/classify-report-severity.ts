'use server';

/**
 * @fileOverview An AI agent for classifying the severity level of a report.
 *
 * - classifyReportSeverity - A function that classifies the severity level of a report.
 * - ClassifyReportSeverityInput - The input type for the classifyReportSeverity function.
 * - ClassifyReportSeverityOutput - The return type for the classifyReportSeverity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyReportSeverityInputSchema = z.object({
  reportText: z
    .string()
    .describe('The text content of the report to be classified.'),
});
export type ClassifyReportSeverityInput = z.infer<typeof ClassifyReportSeverityInputSchema>;

const ClassifyReportSeverityOutputSchema = z.object({
  severityLevel: z
    .enum(['low', 'medium', 'high'])
    .describe(
      'The severity level of the report, classified as low, medium, or high.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the assigned severity level, explaining the factors that influenced the classification.'
    ),
});
export type ClassifyReportSeverityOutput = z.infer<typeof ClassifyReportSeverityOutputSchema>;

export async function classifyReportSeverity(
  input: ClassifyReportSeverityInput
): Promise<ClassifyReportSeverityOutput> {
  return classifyReportSeverityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyReportSeverityPrompt',
  input: {schema: ClassifyReportSeverityInputSchema},
  output: {schema: ClassifyReportSeverityOutputSchema},
  prompt: `You are an AI assistant specializing in classifying the severity level of reports.

  Analyze the provided report text and classify its severity level as either low, medium, or high.
  Provide a brief reasoning for the assigned severity level.

  Report Text: {{{reportText}}}

  Ensure that the output is valid JSON of the following format:
  {
    "severityLevel": "...". // Severity level of the report (low, medium, or high)
    "reasoning": "..." // Reasoning for the assigned severity level
  }`,
});

const classifyReportSeverityFlow = ai.defineFlow(
  {
    name: 'classifyReportSeverityFlow',
    inputSchema: ClassifyReportSeverityInputSchema,
    outputSchema: ClassifyReportSeverityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
