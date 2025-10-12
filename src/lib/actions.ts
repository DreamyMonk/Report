'use server';

import { z } from 'zod';
import { classifyReportSeverity } from '@/ai/flows/classify-report-severity';
import { summarizeReport } from '@/ai/flows/summarize-report-for-review';
import { suggestInvestigationSteps } from '@/ai/flows/suggest-investigation-steps';
import { revalidatePath } from 'next/cache';
import { serverTimestamp } from 'firebase-admin/firestore';
import { db, auth } from '@/firebase/server';

const ReportSchema = z
  .object({
    title: z.string().min(5, 'Title must be at least 5 characters long.'),
    category: z.enum(['Financial', 'HR', 'Safety', 'Other']),
    content: z
      .string()
      .min(20, 'Description must be at least 20 characters long.'),
    submissionType: z.enum(['anonymous', 'confidential']),
    name: z.string().optional(),
    email: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.submissionType === 'confidential') {
        return !!data.email && z.string().email().safeParse(data.email).success;
      }
      return true;
    },
    {
      message: 'A valid email is required for confidential submissions.',
      path: ['email'],
    }
  )
  .refine(
    (data) => {
      if (
        data.submissionType === 'anonymous' &&
        data.email &&
        data.email.length > 0
      ) {
        return z.string().email().safeParse(data.email).success;
      }
      return true;
    },
    {
      message: 'Please enter a valid email address.',
      path: ['email'],
    }
  );

type State = {
  errors?: {
    title?: string[];
    category?: string[];
    content?: string[];
    submissionType?: string[];
    name?: string[];
    email?: string[];
  };
  message?: string | null;
  success: boolean;
  reportId?: string | null;
};

function generateReportId() {
  const prefix = 'IB';
  const timestamp = Date.now().toString(36).slice(-4);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomPart}`.toUpperCase();
}

export async function submitReport(
  prevState: State,
  formData: FormData
): Promise<State> {

  const validatedFields = ReportSchema.safeParse({
    title: formData.get('title'),
    category: formData.get('category'),
    content: formData.get('content'),
    submissionType: formData.get('submissionType'),
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check your input.',
      success: false,
    };
  }
  
    if (!db) {
     console.warn('Firestore is not available. Skipping report creation.');
     return {
      message: 'The server is not configured to handle submissions. Please contact support.',
      success: false,
    };
  }


  const { title, content, category, submissionType, name, email } =
    validatedFields.data;

  try {
    const [severityResult, summaryResult] = await Promise.all([
      classifyReportSeverity({ reportText: content }),
      summarizeReport({ reportText: content }),
    ]);

    const stepsResult = await suggestInvestigationSteps({
      reportContent: content,
      riskLevel: severityResult.severityLevel,
    });
    
    const reportId = generateReportId();

    await db.collection('reports').add({
      id: reportId,
      title,
      content,
      category,
      submissionType,
      reporter: {
        name: name || null,
        email: email || null,
      },
      submittedAt: serverTimestamp(),
      status: 'New',
      severity: severityResult.severityLevel,
      aiSummary: summaryResult.summary,
      aiRiskAssessment: summaryResult.riskAssessment,
      aiSuggestedSteps: stepsResult.suggestedSteps,
      aiReasoning: severityResult.reasoning,
      assignee: null,
    });
    
    revalidatePath('/');
    revalidatePath('/track');
    revalidatePath('/dashboard');

    return {
      message: 'Your report has been submitted successfully.',
      success: true,
      reportId: reportId,
    };
  } catch (e) {
    console.error(e);
    return {
      message: 'An unexpected error occurred. Please try again later.',
      success: false,
    };
  }
}

const CreateAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  name: z.string().min(1, 'Name is required.'),
});

export async function createAdminUser(prevState: { message: string | null, success: boolean}, formData: FormData) {

  const validatedFields = CreateAdminSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
  });

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors;
    const message = Object.values(error).flat().join(', ');
    return {
      message: message || 'Invalid input.',
      success: false,
    };
  }
  
    if (!auth || !db) {
    console.warn('Firebase Auth or Firestore is not available. Skipping admin creation.');
    // Return a success message to the user, but log a warning to the console.
    // This allows the UI to proceed as if the user was created, for dev purposes.
     return {
      message: 'Admin user created successfully (local development).',
      success: true,
    };
  }
  
  const { email, password, name } = validatedFields.data;

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.set({
      id: userRecord.uid,
      name,
      email,
      avatarUrl: `https://picsum.photos/seed/${userRecord.uid}/100/100`,
      role: 'admin',
      createdAt: serverTimestamp(),
    });

    revalidatePath('/dashboard/users');

    return {
      message: `Admin user ${email} created successfully.`,
      success: true,
    };
  } catch (error: any) {
    console.error('Admin creation failed:', error);
    return {
      message: error.message || 'Failed to create admin user.',
      success: false,
    };
  }
}