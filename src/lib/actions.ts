
'use server';

import 'dotenv/config';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { serverTimestamp } from 'firebase-admin/firestore';
import { db, auth } from '@/firebase/server';
import { classifyReportSeverity } from '@/ai/flows/classify-report-severity';
import { summarizeReport } from '@/ai/flows/summarize-report-for-review';
import { suggestInvestigationSteps } from '@/ai/flows/suggest-investigation-steps';

type State = {
  errors?: {
    title?: string[];
    category?: string[];
    content?: string[];
    submissionType?: string[];
    name?: string[];
    email?: string[];
    phone?: string[];
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

export async function initializeData() {
  if (!db) return;
  
  const statusesRef = db.collection('statuses');
  const statusesSnapshot = await statusesRef.limit(1).get();

  if (statusesSnapshot.empty) {
    const statusBatch = db.batch();
    const defaultStatuses = [
      { label: 'New', color: '#3b82f6' },
      { label: 'In Progress', color: '#f97316' },
      { label: 'Resolved', color: '#16a34a' },
      { label: 'Dismissed', color: '#64748b' },
      { label: 'Forwarded', color: '#8b5cf6' },
    ];
    defaultStatuses.forEach(status => {
      const docRef = statusesRef.doc();
      statusBatch.set(docRef, status);
    });
    await statusBatch.commit();
    console.log('Default statuses initialized.');
  }

  const categoriesRef = db.collection('categories');
  const categoriesSnapshot = await categoriesRef.limit(1).get();
  if (categoriesSnapshot.empty) {
    const categoryBatch = db.batch();
    const defaultCategories = [
      { label: 'Financial' },
      { label: 'HR & Harassment' },
      { label: 'Health & Safety' },
      { label: 'Other' }
    ];
    defaultCategories.forEach(category => {
      const docRef = categoriesRef.doc();
      categoryBatch.set(docRef, category);
    });
    await categoryBatch.commit();
    console.log('Default categories initialized.');
  }

  const contentRef = db.collection('content');
  const contentSnapshot = await contentRef.limit(1).get();
  if (contentSnapshot.empty) {
      await contentRef.doc('siteCopy').set({
          submissionGuidelines: `
- **Be Specific:** Include dates, times, locations, and the names of people involved.
- **Provide Evidence:** If you have documents, photos, or other evidence, please mention them in your report. You will be able to attach files after submission.
- **Describe the Impact:** Explain how the issue is affecting the company, its employees, or the public.
- **Stay Factual:** Stick to what you know and have witnessed. Avoid speculation or rumors.
          `
      });
      console.log("Default content initialized.");
  }
}

export async function submitReport(
  prevState: State,
  formData: FormData
): Promise<State> {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const category = formData.get('category') as string;
  const submissionType = formData.get('submissionType') as 'anonymous' | 'confidential';
  const name = formData.get('name') as string | undefined;
  const email = formData.get('email') as string | undefined;
  const phone = formData.get('phone') as string | undefined;

  if (!db) {
    return {
      message: 'The server is not configured to handle submissions. Please contact support.',
      success: false,
    };
  }
  
  if (!title || !content || !category) {
    return {
      message: 'Title, content, and category are required.',
      success: false,
    };
  }

  try {
    const reportId = generateReportId();

    const [severityResult, summaryResult] = await Promise.all([
        classifyReportSeverity({ reportText: content }),
        summarizeReport({ reportText: content })
    ]);

    const stepsResult = await suggestInvestigationSteps({
        reportContent: content,
        riskLevel: severityResult.severityLevel as 'low' | 'medium' | 'high'
    });

    const severityMap = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High'
    }

    const reportRef = await db.collection('reports').add({
      id: reportId,
      title,
      content,
      category,
      submissionType,
      reporter: {
        name: name || null,
        email: submissionType === 'anonymous' ? null : email || null,
        phone: phone || null,
      },
      submittedAt: serverTimestamp(),
      status: 'New',
      severity: severityMap[severityResult.severityLevel] || 'Medium',
      assignees: [],
      aiSummary: summaryResult.summary,
      aiRiskAssessment: summaryResult.riskAssessment,
      aiSuggestedSteps: stepsResult.suggestedSteps,
      aiReasoning: severityResult.reasoning,
    });
    
    // Add to audit log
    await db.collection('audit_logs').add({
        reportId: reportRef.id,
        actor: { id: 'system', name: 'System' },
        action: 'submitted a new report',
        timestamp: serverTimestamp()
    });

    
    revalidatePath('/');
    revalidatePath('/track');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/audit-log');
    revalidatePath('/dashboard/settings');

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

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  name: z.string().min(1, 'Name is required.'),
  role: z.enum(['admin', 'officer']),
  designation: z.string().optional(),
  department: z.string().optional(),
});

type InviteUserState = {
  message: string | null;
  success: boolean;
};


export async function inviteUser(prevState: InviteUserState, formData: FormData) {
  const validatedFields = CreateUserSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
    role: formData.get('role'),
    designation: formData.get('designation'),
    department: formData.get('department'),
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
    console.warn('Firebase Auth or Firestore is not available. Skipping user creation.');
    return {
      message: 'The server is not configured to handle user creation. Please contact support.',
      success: false,
    };
  }

  const { email, password, name, role, designation, department } = validatedFields.data;

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    await auth.setCustomUserClaims(userRecord.uid, { role });

    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.set({
      id: userRecord.uid,
      name,
      email,
      avatarUrl: `https://picsum.photos/seed/${userRecord.uid}/100/100`,
      role,
      designation: designation || null,
      department: department || null,
      createdAt: serverTimestamp(),
    });

    revalidatePath('/dashboard/users');

    return {
      message: `User ${email} created successfully with role: ${role}.`,
      success: true,
    };
  } catch (error: any) {
    console.error('User creation failed:', error);
    return {
      message: error.message || 'Failed to create user.',
      success: false,
    };
  }
}


export async function createAdminUser(prevState: { message: string | null, success: boolean}, formData: FormData) {
  // First, ensure default data is present
  await initializeData();
  
  const adminData = new FormData();
  adminData.append('email', formData.get('email') as string);
  adminData.append('password', formData.get('password') as string);
  adminData.append('name', formData.get('name') as string);
  adminData.append('role', 'admin');
  return inviteUser(prevState, adminData);
}
