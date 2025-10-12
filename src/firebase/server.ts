
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import 'dotenv/config';

let app: App;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Server-side Firebase features will be disabled.'
    );
  } else {
    const serviceAccount = JSON.parse(serviceAccountKey);
    if (!getApps().length) {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (error: any) {
  console.error(
    'Error initializing Firebase Admin SDK:',
    error.message
  );
}

export { app, db, auth };
