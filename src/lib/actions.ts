
'use server';

import { getFirebaseAdmin } from '@/firebase/server';
import { revalidatePath } from 'next/cache';
import type { Firestore } from 'firebase-admin/firestore';
import { Report } from './types';
import { nanoid } from 'nanoid';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// R2 client logic moved here
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error('Cloudflare R2 credentials are not configured in .env');
}

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
  },
});


function generateReportId() {
  const prefix = 'IB';
  const timestamp = Date.now().toString(36).slice(-4);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomPart}`.toUpperCase();
}


export async function submitReport(prevState: any, formData: FormData) {
    if (!prevState) {
      return { message: null, success: false, reportId: null };
    }
    const { db } = getFirebaseAdmin();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;
    const submissionType = formData.get('submissionType') as 'anonymous' | 'confidential';
    const name = formData.get('name') as string | null;
    const email = formData.get('email') as string | null;
    const phone = formData.get('phone') as string | null;

    if (!title || !content || !category) {
      return { 
        message: "Please fill out all required fields.",
        success: false,
        reportId: null
      };
    }
    
    try {
        const reportId = generateReportId();

        const reportData: Omit<Report, 'docId' | 'submittedAt'> = {
          id: reportId,
          title,
          content,
          category,
          submissionType,
          reporter: {
            name: name || undefined,
            email: email || undefined,
            phone: phone || undefined,
          },
          status: 'New',
          severity: 'Medium', // Default severity
          assignees: [],
          // AI fields are omitted
        };
        
        // Remove undefined properties before sending to Firestore
        if (!reportData.reporter?.name) delete reportData.reporter?.name;
        if (!reportData.reporter?.email) delete reportData.reporter?.email;
        if (!reportData.reporter?.phone) delete reportData.reporter?.phone;


        const reportRef = await db.collection('reports').add({
            ...reportData,
            submittedAt: new Date()
        });

        await db.collection('audit_logs').add({
            reportId: reportRef.id,
            actor: { id: 'system', name: 'System' },
            action: 'submitted a new report',
            timestamp: new Date()
        });
        
        revalidatePath('/');
        return {
            message: "Your report has been submitted.",
            success: true,
            reportId: reportId,
        };

    } catch (e: any) {
        console.error('Submission Error:', e);
        return {
            message: e.message || 'An unexpected error occurred. Please try again later.',
            success: false,
            reportId: null
        };
    }
}

export async function getSignedR2Url(reportId: string, fileName: string, fileType: string) {
    if (!process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
        return { success: false, error: "R2 environment variables are not set." };
    }
    
    const key = `reports/${reportId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
    });
    
    try {
        const signedUrl = await getSignedUrl(R2, command, { expiresIn: 3600 });
        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
        
        return { success: true, url: signedUrl, publicUrl: publicUrl };
    } catch (error) {
        console.error("Error generating signed URL:", error);
        return { success: false, error: "Could not generate upload URL." };
    }
}


export async function createAdminUser(prevState: any, formData: FormData) {
  try {
    const { auth, db } = getFirebaseAdmin();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      name: name,
      email: email,
      role: 'admin',
      avatarUrl: `https://picsum.photos/seed/${userRecord.uid}/100/100`,
      createdAt: new Date(),
      requiresPasswordChange: false,
    });
    
    await initializeData(db);

    return { message: `Admin user ${email} created successfully. You can now log in.`, success: true };
  } catch (error: any) {
    return { message: error.message || 'Failed to create admin user.', success: false };
  }
}

export async function hasAdminUser(): Promise<boolean> {
    try {
        const { db } = getFirebaseAdmin();
        const adminSnapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
        return !adminSnapshot.empty;
    } catch (error) {
        console.error("Error checking for admin user:", error);
        // In case of an error, assume an admin exists to prevent showing the setup page unnecessarily.
        return true;
    }
}

export async function updateUser(prevState: any, formData: FormData) {
    try {
        const { auth, db } = getFirebaseAdmin();
        const docId = formData.get('userId') as string;
        const email = formData.get('email') as string;
        const name = formData.get('name') as string;
        const role = formData.get('role') as string;
        const designation = formData.get('designation') as string | undefined;
        const department = formData.get('department') as string | undefined;

        if (!docId) {
            return { message: 'User ID is missing.', success: false };
        }
        
        const userRec = await auth.getUserByEmail(email);

        await auth.updateUser(userRec.uid, {
            displayName: name,
        });
        await auth.setCustomUserClaims(userRec.uid, { role });
        await db.collection('users').doc(docId).update({
            name,
            role,
            designation: designation || null,
            department: department || null,
        });
        revalidatePath('/dashboard/users');
        return { message: `User ${email} has been updated.`, success: true };

    } catch (error: any) {
        return { message: error.message || 'Failed to update user.', success: false };
    }
}


export async function inviteUser(prevState: any, formData: FormData) {
    try {
        const { auth, db } = getFirebaseAdmin();
        const email = formData.get('email') as string;
        const name = formData.get('name') as string;
        const role = formData.get('role') as string;
        const designation = formData.get('designation') as string | undefined;
        const department = formData.get('department') as string | undefined;
        const password = formData.get('password') as string;
        
        if (!password || password.length < 6) {
            return { message: 'The password must be a string with at least 6 characters.', success: false };
        }

        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
        });

        await auth.setCustomUserClaims(userRecord.uid, { role });

        await db.collection('users').doc(userRecord.uid).set({
            id: userRecord.uid,
            name: name,
            email: email,
            role: role,
            designation: designation || null,
            department: department || null,
            avatarUrl: `https://picsum.photos/seed/${userRecord.uid}/100/100`,
            createdAt: new Date(),
            requiresPasswordChange: true,
        });
        
        revalidatePath('/dashboard/users');
        return { message: `User ${email} has been invited as a ${role}.`, success: true };

    } catch (error: any) {
        return { message: error.message || 'Failed to process user.', success: false };
    }
}

export async function deleteUser(prevState: any, formData: FormData) {
    try {
        const { auth, db } = getFirebaseAdmin();
        const docId = formData.get('docId') as string;
        const userUid = formData.get('userUid') as string;

        if (!docId || !userUid) {
            return { message: 'User ID is missing.', success: false };
        }

        await auth.deleteUser(userUid);
        await db.collection('users').doc(docId).delete();

        revalidatePath('/dashboard/users');
        return { message: 'User has been successfully removed.', success: true };
    } catch (error: any) {
        return { message: error.message || 'Failed to remove user.', success: false };
    }
}


export async function updatePassword(prevState: any, formData: FormData) {
    try {
        const { auth, db } = getFirebaseAdmin();
        const password = formData.get('password') as string;
        const uid = formData.get('uid') as string;
        
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
        }

        await auth.updateUser(uid, { password });
        await db.collection('users').doc(uid).update({
            requiresPasswordChange: false,
        });

        return { message: 'Password updated successfully.', success: true };
    } catch (error: any) {
        return { message: error.message || 'Failed to update password.', success: false };
    }
}


export async function initializeData(db: Firestore) {
  if (!db) {
    console.error('Database not initialized, skipping data seeding.');
    return;
  }
  const statusesCollection = db.collection('statuses');
  const statusesSnapshot = await statusesCollection.get();
  if (statusesSnapshot.empty) {
    const defaultStatuses = [
      { label: 'Report Submitted', color: '#64748b', isDefault: true },
      { label: 'Case Officer Assigned', color: '#f97316', isDefault: true },
      { label: 'Case Closed', color: '#22c55e', isDefault: true },
      { label: 'New', color: '#3b82f6', isDefault: false }, // Internal status
      { label: 'In Progress', color: '#f97316', isDefault: false }, // Internal status
      { label: 'Resolved', color: '#22c55e', isDefault: false }, // Maps to Case Closed
      { label: 'Dismissed', color: '#ef4444', isDefault: false }
    ];
    for (const status of defaultStatuses) {
      await statusesCollection.add(status);
    }
    console.log('Seeded default statuses.');
  }

  const categoriesCollection = db.collection('categories');
  const categoriesSnapshot = await categoriesCollection.get();
  if (categoriesSnapshot.empty) {
    const defaultCategories = [
      { label: 'Financial Misconduct' },
      { label: 'Harassment or Discrimination' },
      { label: 'Health and Safety Violations' },
      { label: 'Data Privacy Breach' },
      { label: 'Other' },
    ];
    for (const category of defaultCategories) {
      await categoriesCollection.add(category);
    }
     console.log('Seeded default categories.');
  }

  const contentCollection = db.collection('content');
  const contentDoc = await contentCollection.doc('siteCopy').get();
  if (!contentDoc.exists) {
    await contentCollection.doc('siteCopy').set({
        submissionGuidelines: `**1. Be Specific and Factual:**
- Provide clear and concise details about the incident.
- Include dates, times, locations, and the names of people involved.
- Stick to the facts and avoid speculation or personal feelings.

**2. Provide Evidence (if possible):**
- If you have any documents, photos, or other evidence, please mention them in your report. You can attach files to your submission.
- Do not put yourself at risk to obtain evidence. Your safety is paramount.

**3. Explain the Impact:**
- Describe how the issue has affected you, others, or the organization.
- This helps us understand the severity and urgency of the situation.
        `
    });
     console.log('Seeded default content.');
  }
}
