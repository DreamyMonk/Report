
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

  // Use a ref to memoize the query object. This is important to prevent
  // infinite loops in the useEffect hook.
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
        },
        (err: FirestoreError) => {
            console.error(err);
            setError(err);
            setLoading(false);
        }
        );
        return () => unsubscribe();
    } else {
        getDocs(q).then((querySnapshot) => {
            const docs = querySnapshot.docs.map((doc) => ({
                docId: doc.id,
                ...doc.data(),
            })) as T[];
            setData(docs);
            setLoading(false);
        }).catch((err) => {
            console.error(err);
            setError(err);
            setLoading(false);
        });
    }


  }, [firestore, queryRef, options.listen]);

  return { data, loading, error, firestore };
}
