
'use client';
import { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  getDocs,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export interface UseCollectionOptions {
  listen: boolean;
}

const defaultOptions: UseCollectionOptions = {
  listen: true,
};

export function useCollection<T>(
  pathOrQuery: string | Query | null,
  options: UseCollectionOptions = defaultOptions
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const queryRef = useRef(pathOrQuery);
  if (JSON.stringify(queryRef.current) !== JSON.stringify(pathOrQuery)) {
    queryRef.current = pathOrQuery;
  }

  useEffect(() => {
    if (!firestore || !queryRef.current) {
      setLoading(false);
      return;
    }

    let q: Query;
    if (typeof queryRef.current === 'string') {
      q = query(collection(firestore, queryRef.current));
    } else {
      q = queryRef.current;
    }

    if (options.listen) {
        const unsubscribe = onSnapshot(
        q,
        (querySnapshot: QuerySnapshot<DocumentData>) => {
            const docs = querySnapshot.docs.map((doc) => ({
            docId: doc.id,
            ...doc.data(),
            })) as T[];
            setData(docs);
            setLoading(false);
            setError(null);
        },
        (err: FirestoreError) => {
            const permissionError = new FirestorePermissionError({
              path: q.toString(),
              operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setError(err);
            setLoading(false);
        }
        );
        return () => unsubscribe();
    } else {
        setLoading(true);
        getDocs(q).then((querySnapshot) => {
            const docs = querySnapshot.docs.map((doc) => ({
                docId: doc.id,
                ...doc.data(),
            })) as T[];
            setData(docs);
            setLoading(false);
        }).catch((err) => {
            const permissionError = new FirestorePermissionError({
              path: q.toString(),
              operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
            setError(err);
            setLoading(false);
        });
    }


  }, [firestore, queryRef, options.listen]);

  return { data, loading, error };
}
