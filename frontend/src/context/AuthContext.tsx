'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export type AuthCategory = 'owner' | 'employee';

export interface AuthUser {
  username: string;
  category: AuthCategory;
  name: string;
  email: string;
  roleTitle: string;
  operationalRole?: string;
}

// Preset demo users
export const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  // Owner Credentials
  'owner@vastra.com': {
    password: 'owner123',
    user: {
      username: 'owner@vastra.com',
      category: 'owner',
      name: 'Sarah Chen',
      email: 'owner@vastra.com',
      roleTitle: 'Mill Owner & Director',
    },
  },
  'owner': {
    password: 'owner123',
    user: {
      username: 'owner',
      category: 'owner',
      name: 'Sarah Chen',
      email: 'owner@vastra.com',
      roleTitle: 'Mill Owner & Director',
    },
  },
  // Employee Credentials
  'employee@vastra.com': {
    password: 'employee123',
    user: {
      username: 'employee@vastra.com',
      category: 'employee',
      name: 'Alex Kumar',
      email: 'employee@vastra.com',
      roleTitle: 'Operational Staff',
    },
  },
  'employee': {
    password: 'employee123',
    user: {
      username: 'employee',
      category: 'employee',
      name: 'Alex Kumar',
      email: 'employee@vastra.com',
      roleTitle: 'Operational Staff',
    },
  },
};

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isEmployee: boolean;
  isLoading: boolean;
  login: (username: string, password: string, selectedOperationalRole?: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'vastra_demo_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.category === 'owner' || parsed.category === 'employee')) {
          setUser(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (
    rawUsername: string,
    rawPassword: string,
    selectedOperationalRole?: string
  ): { success: boolean; error?: string } => {
    const username = (rawUsername || '').trim().toLowerCase();
    const password = (rawPassword || '').trim();

    if (!username || !password) {
      return { success: false, error: 'Please enter both username/email and password.' };
    }

    const match = DEMO_USERS[username];
    if (!match || match.password !== password) {
      return {
        success: false,
        error: 'Invalid credentials. Use demo credentials (owner@vastra.com / owner123 or employee@vastra.com / employee123).',
      };
    }

    // Role-based authorization category check
    if (match.user.category === 'employee' && selectedOperationalRole === 'owner') {
      return {
        success: false,
        error: 'Access Denied: Employee credentials cannot access Owner modules. Please sign in with Owner credentials.',
      };
    }

    const sessionUser: AuthUser = {
      ...match.user,
      operationalRole: selectedOperationalRole || (match.user.category === 'owner' ? 'owner' : 'storekeeper'),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    } catch (err) {
      console.error('Failed to save session:', err);
    }

    setUser(sessionUser);
    return { success: true };
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
    setUser(null);
    router.push('/');
  };

  const isOwner = user?.category === 'owner';
  const isEmployee = user?.category === 'employee';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isOwner,
        isEmployee,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
