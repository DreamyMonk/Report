'use client';
import { useState, useEffect, useRef } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
  FirestoreError,
  getDoc,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export interface UseDocOptions {
  listen: boolean;
}

const defaultOptions: UseDocOptions = {
  listen: true,
};

export function useDoc<T>(
  pathOrRef: string | DocumentReference | null,
  options: UseDocOptions = defaultOptions
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  // Use a ref to store the string representation of the path for comparison
  const pathRef = useRef<string | null>(null);
  const newPath = pathOrRef ? (typeof pathOrRef === 'string' ? pathOrRef : pathOrRef.path) : null;

  if (newPath !== pathRef.current) {
      pathRef.current = newPath;
  }

  useEffect(() => {
    if (!firestore || !pathRef.current) {
      setLoading(false);
      return;
    }

    const docRef: DocumentReference = doc(firestore, pathRef.current);

    if (options.listen) {
      const unsubscribe = onSnapshot(
        docRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setData({ docId: docSnapshot.id, ...docSnapshot.data() } as T);
          } else {
            setData(null);
          }
          setLoading(false);
          setError(null);
        },
        (err: FirestoreError) => {
            const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
            setError(err);
            setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
        setLoading(true);
        getDoc(docRef).then((docSnapshot) => {
             if (docSnapshot.exists()) {
                setData({ docId: docSnapshot.id, ...docSnapshot.data() } as T);
             } else {
                setData(null);
             }
             setLoading(false);
        }).catch((err) => {
            const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
            setError(err);
            setLoading(false);
        });
    }

  }, [firestore, pathRef.current, options.listen]);

  return { data, loading, error };
}
