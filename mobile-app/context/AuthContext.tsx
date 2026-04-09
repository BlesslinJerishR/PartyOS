import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { AuthResponse, UserRole } from '../types';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthResponse['user'] | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    token: null,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    const token = await storage.getToken();
    const user = await storage.getUser();

    if (token && user) {
      setState({
        isLoading: false,
        isAuthenticated: true,
        user,
        token,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const login = useCallback(async (username: string, password: string) => {
    const response = (await api.auth.login(username, password)) as AuthResponse;
    await storage.setToken(response.accessToken);
    await storage.setUser(response.user);
    setState({
      isLoading: false,
      isAuthenticated: true,
      user: response.user,
      token: response.accessToken,
    });
  }, []);

  const signup = useCallback(async (username: string, password: string) => {
    const response = (await api.auth.signup(username, password)) as AuthResponse;
    await storage.setToken(response.accessToken);
    await storage.setUser(response.user);
    setState({
      isLoading: false,
      isAuthenticated: true,
      user: response.user,
      token: response.accessToken,
    });
  }, []);

  const logout = useCallback(async () => {
    await storage.clearAll();
    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
    });
  }, []);

  const setRole = useCallback(async (role: UserRole) => {
    const updated = (await api.users.setRole(role)) as AuthResponse['user'];
    await storage.setUser(updated);
    setState((prev) => ({ ...prev, user: updated }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
