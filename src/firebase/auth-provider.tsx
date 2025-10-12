'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { app } from './client';
import { doc, getDoc, setDoc, getFirestore, serverTimestamp } from 'firebase/firestore';
import { setCookie, destroyCookie } from 'nookies';
import type { User } from '@/lib/types';
import { FirebaseClientProvider } from './client-provider';

const AuthContext = createContext<{ user: FirebaseUser | null; userData: User | null; loading: boolean }>({ user: null, userData: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const token = await firebaseUser.getIdToken();
        setCookie(null, 'firebaseToken', token, {
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
        });

        // Sync user profile with firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            // New user, create profile
            const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'New User',
                email: firebaseUser.email!,
                avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
                role: 'officer' // Default role
            };
            await setDoc(userRef, { ...newUser, createdAt: serverTimestamp() });
            setUserData(newUser);
        } else {
            setUserData({ docId: userDoc.id, ...userDoc.data() } as User);
        }

      } else {
        setUser(null);
        setUserData(null);
        destroyCookie(null, 'firebaseToken');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
        <FirebaseClientProvider>
            {children}
        </FirebaseClientProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
