// ══════════════════════════════════════════════════════════════════════════════
// src/context/AuthContext.tsx
// المهمة 9-3: Context للمستخدم الحالي مع login/logout
// ══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/api';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // Verify token with server
      authApi.me().then(result => {
        if (result.success && result.data) {
          setUser(result.data as AuthUser);
        } else {
          // Token invalid, remove it
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await authApi.login({ username, password });
      if (result.success && result.data) {
        const { token: newToken, user: userData } = result.data as { token: string; user: AuthUser };
        localStorage.setItem('auth_token', newToken);
        setToken(newToken);
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
