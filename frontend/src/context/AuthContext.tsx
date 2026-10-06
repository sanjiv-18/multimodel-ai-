import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  demoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('learnflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const u = await authService.getMe();
          setUser(u);
        } catch {
          localStorage.removeItem('learnflow_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await authService.login(email, pass);
    localStorage.setItem('learnflow_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await authService.register(email, pass, name);
    localStorage.setItem('learnflow_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const demoLogin = async () => {
    await login('demo@learnflow.ai', 'demo1234');
  };

  const logout = () => {
    localStorage.removeItem('learnflow_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
