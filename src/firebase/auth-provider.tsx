'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from './client';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { setCookie, destroyCookie } from 'nookies';

const AuthContext = createContext<{ user: User | null }>({ user: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const token = await user.getIdToken();
        const idTokenResult = await user.getIdTokenResult();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        setCookie(null, 'firebaseToken', token, {
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
        });

      } else {
        destroyCookie(null, 'firebaseToken');
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
