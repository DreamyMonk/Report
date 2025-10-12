"use server";

import { z } from "zod";
import { classifyReportSeverity } from "@/ai/flows/classify-report-severity";
import { summarizeReport } from "@/ai/flows/summarize-report-for-review";
import { suggestInvestigationSteps } from "@/ai/flows/suggest-investigation-steps";
import { revalidatePath } from "next/cache";

const ReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  category: z.enum(["Financial", "HR", "Safety", "Other"]),
  content: z.string().min(20, "Description must be at least 20 characters long."),
  submissionType: z.enum(["anonymous", "confidential"]),
  name: z.string().optional(),
  email: z.string().optional(),
}).refine(data => {
  if (data.submissionType === 'confidential') {
    return !!data.email && z.string().email().safeParse(data.email).success;
  }
  return true;
}, {
  message: "A valid email is required for confidential submissions.",
  path: ["email"],
}).refine(data => {
  if (data.submissionType === 'anonymous' && data.email && data.email.length > 0) {
     return z.string().email().safeParse(data.email).success;
  }
  return true;
},
{
  message: "Please enter a valid email address.",
  path: ["email"],
});

type State = {
  errors?: {
    title?: string[];
    category?: string[];
    content?: string[];
    submissionType?: string[],
    name?: string[],
    email?: string[],
  };
  message?: string | null;
  success: boolean;
  reportId?: string | null;
};

function generateReportId() {
  const prefix = "IB";
  const timestamp = Date.now().toString(36).slice(-4);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomPart}`.toUpperCase();
}


export async function submitReport(prevState: State, formData: FormData): Promise<State> {
  const validatedFields = ReportSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    content: formData.get("content"),
    submissionType: formData.get("submissionType"),
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check your input.",
      success: false,
    };
  }

  const { title, content, category, submissionType, name, email } = validatedFields.data;
  const isAnonymous = submissionType === 'anonymous';

  try {
    // Simulate a delay for AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, you'd call your AI flows here.
    console.log("Submitting report and running AI analysis...");
    console.log({ title, content, category, isAnonymous, name, email });
    
    // Example of calling the AI flows:
    // const severityResult = await classifyReportSeverity({ reportText: content });
    // const summaryResult = await summarizeReport({ reportText: content });
    // const stepsResult = await suggestInvestigationSteps({
    //   reportContent: content,
    //   riskLevel: severityResult.severityLevel,
    // });
    
    // After getting AI results, you would save the complete report to your database.
    const reportId = generateReportId();
    // e.g., db.reports.create({ ...validatedFields.data, id: reportId, ...aiResults });

    revalidatePath("/");
    revalidatePath("/track");

    return {
      message: "Your report has been submitted successfully.",
      success: true,
      reportId: reportId,
    };
  } catch (e) {
    console.error(e);
    return {
      message: "An unexpected error occurred. Please try again later.",
      success: false,
    };
  }
}
