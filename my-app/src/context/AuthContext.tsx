"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<BusinessUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const unsub = setupAuthListener(async (authUser) => {
      try {
        setFirebaseUser(authUser);

        if (!authUser) {
          setDbUser(null);
          setBusiness(null);
          setLoading(false);
          return;
        }

        const user = await getCurrentUser(authUser);
        setDbUser(user);

        if (user?.businessId) {
          const biz = await getBusinessInfo(user.businessId);
          setBusiness(biz);
        }

        setLoading(false);
      } catch (err) {
        console.error("Auth error:", err);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

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
