"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";

import {
  setupAuthListener,
  getCurrentUser,
  getBusinessInfo,
  signOut,
} from "@/lib/auth.service";

import { BusinessUser, Business } from "@/types/database";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  dbUser: BusinessUser | null;
  business: Business | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<BusinessUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accountRequest = useRef(0);

  const loadAccount = useCallback(async (authUser: FirebaseUser | null) => {
    const request = ++accountRequest.current;
    setFirebaseUser(authUser);
    setLoading(true);
    setError(null);
    setDbUser(null);
    setBusiness(null);

    try {
      if (!authUser) return;
      const user = await getCurrentUser(authUser);
      const biz = user?.businessId ? await getBusinessInfo(user.businessId) : null;
      if (request !== accountRequest.current) return;
      setDbUser(user);
      setBusiness(biz);
    } catch (err) {
      if (request !== accountRequest.current) return;
      setError(err instanceof Error ? err.message : 'Kunne ikke hente kontoen. Prøv igjen.');
    } finally {
      if (request === accountRequest.current) setLoading(false);
    }
  }, []);

  const refreshBusiness = useCallback(async () => {
    if (!dbUser?.businessId) return;

    try {
      const biz = await getBusinessInfo(dbUser.businessId);
      setBusiness(biz);
    } catch (err) {
      console.error("Business refresh error:", err);
    }
  }, [dbUser?.businessId]);

  const refreshCurrentUser = useCallback(async () => {
    if (!firebaseUser) return;
    await loadAccount(firebaseUser);
  }, [firebaseUser, loadAccount]);

  useEffect(() => {
    const unsub = setupAuthListener(loadAccount);
    return () => { accountRequest.current += 1; unsub(); };
  }, [loadAccount]);

  const logout = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbUser,
        business,
        loading,
        error,
        isAuthenticated: !!firebaseUser && !!dbUser,
        logout,
        refreshBusiness,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
