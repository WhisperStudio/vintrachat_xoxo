'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setupAuthListener, getCurrentUserFromDB } from '@/lib/auth';
import { User as DBUser, Business } from '@/types/database';
import { getBusinessInfo } from '@/lib/auth';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  dbUser: DBUser | null;
  business: Business | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  dbUser: null,
  business: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDBUser] = useState<DBUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Setup auth listener
    const unsubscribe = setupAuthListener(async (authUser) => {
      try {
        setFirebaseUser(authUser);
        
        if (authUser) {
          // Hent brukerdata fra database
          const userData = await getCurrentUserFromDB(authUser);
          setDBUser(userData || null);

          // Hvis brukers finnes, hent bedriftsinformasjon
          if (userData) {
            const businessData = await getBusinessInfo(userData.businessId);
            setBusiness(businessData || null);
          }
        } else {
          setDBUser(null);
          setBusiness(null);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Auth error:', err);
        setError('En feil oppstod under innlasting av brukerdata');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    firebaseUser,
    dbUser,
    business,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
