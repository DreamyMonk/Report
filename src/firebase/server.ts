
'use server';
import 'dotenv/config';
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
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Server-side Firebase features will be disabled.');
  }
  
  const serviceAccount = JSON.parse(serviceAccountKey);
  
  app = initializeApp({
    credential: cert(serviceAccount),
  });
  
  auth = getAuth(app);
  db = getFirestore(app);

  return { app, auth, db };
}

export { getFirebaseAdmin };
