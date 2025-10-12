'use client';
import { useState, useEffect, useRef } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

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

  const docRefRef = useRef(pathOrRef);
  if (JSON.stringify(docRefRef.current) !== JSON.stringify(pathOrRef)) {
    docRefRef.current = pathOrRef;
  }

  useEffect(() => {
    if (!firestore || !docRefRef.current) {
      setLoading(false);
      return;
    }

    let docRef: DocumentReference;
    if (typeof docRefRef.current === 'string') {
      docRef = doc(firestore, docRefRef.current);
    } else {
      docRef = docRefRef.current;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setData({ docId: docSnapshot.id, ...docSnapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, docRefRef]);

  return { data, loading, error, firestore };
}
