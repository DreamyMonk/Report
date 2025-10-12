
'use server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

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

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set in your .env file. Server-side Firebase features cannot be initialized. Please add it to your .env file and restart the server.');
  }
  
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    app = initializeApp({
      credential: cert(serviceAccount),
    });
    
    auth = getAuth(app);
    db = getFirestore(app);

    return { app, auth, db };
  } catch (error: any) {
    throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Please ensure it is a valid JSON string. Original error: ${error.message}`);
  }
}

export { getFirebaseAdmin };
