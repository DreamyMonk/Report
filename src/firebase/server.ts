
'use server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
// import serviceAccount from '../../firebase-service-account-key.json'; // No longer needed

let app: App;
let auth: Auth;
let db: Firestore;

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    return { app, auth, db };
  }
  
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error('Firebase Admin SDK credentials are not fully configured in environment variables.');
    }

    app = initializeApp({
      credential: cert(serviceAccount),
    });
    
    auth = getAuth(app);
    db = getFirestore(app);

    return { app, auth, db };
  } catch (error: any) {
    throw new Error(`Failed to initialize Firebase Admin SDK. Original error: ${error.message}`);
  }
}

export { getFirebaseAdmin };
