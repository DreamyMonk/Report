import {
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
} from './provider';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser } from './auth/use-user';
import { FirebaseProvider } from './provider';
import { FirebaseClientProvider } from './client-provider';

// This is the only function that should be used to initialize the firebase services in server components.
function initializeFirebase() {
  console.warn(
    'initializeFirebase is a no-op on the client, and should only be used in server components. Please use the useFirebase, useFirestore, and useAuth hooks instead.'
  );
  return {
    app: null,
    firestore: null,
    auth: null,
  };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useCollection,
  useDoc,
  useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
};
