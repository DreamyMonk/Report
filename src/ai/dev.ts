import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-investigation-steps.ts';
import '@/ai/flows/summarize-report-for-review.ts';
import '@/ai/flows/classify-report-severity.ts';