import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// Load environment variables from a .env file
// require('dotenv').config();

const serviceKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceKey) {
  throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please add it to your .env file.');
}

const serviceAcct = JSON.parse(Buffer.from(serviceKey, 'base64').toString('utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAcct),
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
  });
}

export const db = getFirestore();
