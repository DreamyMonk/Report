import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

// Load environment variables from a .env file
// require('dotenv').config();

const serviceKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// NOTE: This is a placeholder for local development.
// In a real production environment, you would use a more secure way to manage service account keys.
const mockServiceKey = {
  "type": "service_account",
  "project_id": "wieblower",
  "private_key_id": "d0e1b69829f270034b7911e3b5311f0a2d3c4b5d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/p+e5gX3x/kY2\n1f6qj9d7Z2p7x6eP/xT4bN7sZ9xY8l3d2a7n7...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-12345@wieblower.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-12345%40wieblower.iam.gserviceaccount.com"
};

let serviceAcct: any;

if (serviceKey) {
  try {
    serviceAcct = JSON.parse(Buffer.from(serviceKey, 'base64').toString('utf8'));
  } catch(e) {
    console.error("Could not parse FIREBASE_SERVICE_ACCOUNT_KEY. Using mock key for local dev.", e)
    serviceAcct = mockServiceKey;
  }
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not set. Using mock key for local dev.");
  serviceAcct = mockServiceKey;
}


if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAcct),
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
  });
}

export const db = getFirestore();
