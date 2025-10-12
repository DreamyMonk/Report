
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { auth, db } from '@/firebase/server';
import { revalidatePath } from 'next/cache';

export async function createAdminUser(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    if (!auth || !db) {
        throw new Error('Firebase admin not initialized');
    }

    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
    });

    await getAuth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

    await getFirestore().collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      name: name,
      email: email,
      role: 'admin',
      avatarUrl: `https://picsum.photos/seed/${userRecord.uid}/100/100`,
      createdAt: new Date(),
    });
    
    // Seed initial data
    await initializeData();

    return { message: `Admin user ${email} created successfully. You can now log in.`, success: true };
  } catch (error: any) {
    return { message: error.message || 'Failed to create admin user.', success: false };
  }
}

export async function inviteUser(prevState: any, formData: FormData) {
    try {
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const name = formData.get('name') as string;
        const role = formData.get('role') as string;
        const designation = formData.get('designation') as string | undefined;
        const department = formData.get('department') as string | undefined;

        if (!auth || !db) {
            throw new Error('Firebase admin not initialized');
        }

        const userRecord = await getAuth().createUser({
            email,
            password,
            displayName: name,
        });

        await getAuth().setCustomUserClaims(userRecord.uid, { role });

        await getFirestore().collection('users').doc(userRecord.uid).set({
            id: userRecord.uid,
            name: name,
            email: email,
            role: role,
            designation: designation || null,
            department: department || null,
            avatarUrl: `https://picsum.photos/seed/${userRecord.uid}/100/100`,
            createdAt: new Date(),
        });
        
        revalidatePath('/dashboard/users');
        return { message: `User ${email} has been invited as a ${role}.`, success: true };

    } catch (error: any) {
        return { message: error.message || 'Failed to invite user.', success: false };
    }
}

export async function initializeData() {
  if (!db) {
    console.error('Database not initialized, skipping data seeding.');
    return;
  }
  const statusesCollection = db.collection('statuses');
  const statusesSnapshot = await statusesCollection.get();
  if (statusesSnapshot.empty) {
    const defaultStatuses = [
      { label: 'New', color: '#3b82f6' },
      { label: 'In Progress', color: '#f97316' },
      { label: 'Resolved', color: '#22c55e' },
      { label: 'Dismissed', color: '#64748b' },
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
