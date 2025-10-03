'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { AuthUser, checkUserRole } from '@/lib/firebase/auth';
import { User } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user role from Firestore
          const userRole = await checkUserRole(firebaseUser.uid);
          const isAdmin = userRole === 'admin';

          const authUser: AuthUser = {
            ...firebaseUser,
            role: userRole,
            isAdmin,
          };

          setUser(authUser);
        } catch (error) {
          console.error('Error setting user data:', error);
          // Fallback to basic user data
          setUser({
            ...firebaseUser,
            role: 'participant',
            isAdmin: false,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { signOut: firebaseSignOut } = await import('@/lib/firebase/auth');
      await firebaseSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin: user?.isAdmin || false,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};