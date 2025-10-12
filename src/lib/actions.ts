"use server";

import { z } from "zod";
import { classifyReportSeverity } from "@/ai/flows/classify-report-severity";
import { summarizeReportForReview } from "@/ai/flows/summarize-report-for-review";
import { suggestInvestigationSteps } from "@/ai/flows/suggest-investigation-steps";
import { revalidatePath } from "next/cache";

const ReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  category: z.enum(["Financial", "HR", "Safety", "Other"]),
  content: z.string().min(20, "Description must be at least 20 characters long."),
  isAnonymous: z.boolean(),
});

type State = {
  errors?: {
    title?: string[];
    category?: string[];
    content?: string[];
  };
  message?: string | null;
  success: boolean;
};

export async function submitReport(prevState: State, formData: FormData): Promise<State> {
  const isAnonymousValue = formData.get("isAnonymous") === "on";
  
  const validatedFields = ReportSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    content: formData.get("content"),
    isAnonymous: isAnonymousValue,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check your input.",
      success: false,
    };
  }

  const { title, content, category, isAnonymous } = validatedFields.data;

  try {
    // Simulate a delay for AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, you'd call your AI flows here.
    // For this example, we'll just log it.
    console.log("Submitting report and running AI analysis...");
    console.log({ title, content, category, isAnonymous });
    
    // Example of calling the AI flows:
    // const severityResult = await classifyReportSeverity({ reportText: content });
    // const summaryResult = await summarizeReportForReview({ reportText: content });
    // const stepsResult = await suggestInvestigationSteps({
    //   reportContent: content,
    //   riskLevel: severityResult.severityLevel,
    // });
    
    // After getting AI results, you would save the complete report to your database.
    // e.g., db.reports.create({ ...validatedFields.data, ...aiResults });

    revalidatePath("/"); // Revalidate the page if needed

    return {
      message: "Your report has been submitted successfully. Thank you for your courage and integrity.",
      success: true,
    };
  } catch (e) {
    console.error(e);
    return {
      message: "An unexpected error occurred. Please try again later.",
      success: false,
    };
  }
}
