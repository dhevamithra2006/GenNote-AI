import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  register: (name: string, email: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gennote_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const storedToken = localStorage.getItem('gennote_token');
        if (storedToken) {
          const { user } = await api.getMe();
          setUser(user);
        } else {
          // Initialize demo user automatically for seamless out-of-the-box exploration
          const { user: demoUser, token: demoToken } = await api.demoLogin();
          localStorage.setItem('gennote_token', demoToken);
          setToken(demoToken);
          setUser(demoUser);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        // Fallback to demo
        try {
          const { user: demoUser, token: demoToken } = await api.demoLogin();
          localStorage.setItem('gennote_token', demoToken);
          setToken(demoToken);
          setUser(demoUser);
        } catch {}
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email);
      localStorage.setItem('gennote_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string) => {
    setIsLoading(true);
    try {
      const res = await api.register(name, email);
      localStorage.setItem('gennote_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await api.demoLogin();
      localStorage.setItem('gennote_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('gennote_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
