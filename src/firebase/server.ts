import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './config';

let app: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

const serviceKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceKey) {
  try {
    const serviceAcct = JSON.parse(Buffer.from(serviceKey, 'base64').toString('utf8'));
    if (!getApps().length) {
      app = initializeApp({
        credential: cert(serviceAcct),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
      });
    } else {
      app = getApps()[0];
    }
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it is a valid base64 encoded JSON string.", e);
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Firebase Admin SDK will not be initialized. Server-side actions requiring admin privileges will fail.");
}

if(app) {
    db = getFirestore(app);
    auth = getAuth(app);
}

// We export nullable versions for safer usage in the app
export { db, auth };
