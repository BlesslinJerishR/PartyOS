import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { AuthResponse, UserRole } from '../types';
import { DarkTheme, LightTheme, ThemeColors } from '../constants/Colors';

const THEME_KEY = 'partyos_theme';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthResponse['user'] | null;
  token: string | null;
}

interface ThemeState {
  isDark: boolean;
  colors: ThemeColors;
}

interface AuthContextValue extends AuthState, ThemeState {
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    token: null,
  });

  const [themeState, setThemeState] = useState<ThemeState>({
    isDark: true,
    colors: DarkTheme,
  });

  useEffect(() => {
    loadStoredAuth();
    loadStoredTheme();
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

  const loadStoredTheme = async () => {
    const val = await AsyncStorage.getItem(THEME_KEY);
    if (val === 'light') {
      setThemeState({ isDark: false, colors: LightTheme });
    }
  };

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = !prev.isDark;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
      return { isDark: next, colors: next ? DarkTheme : LightTheme };
    });
  }, []);

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

  const contextValue = useMemo<AuthContextValue>(() => ({
    ...state,
    ...themeState,
    login,
    signup,
    logout,
    setRole,
    toggleTheme,
  }), [state, themeState, login, signup, logout, setRole, toggleTheme]);

  return (
    <AuthContext.Provider value={contextValue}>
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

export function useTheme() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useTheme must be used within an AuthProvider');
  }
  return { colors: context.colors, isDark: context.isDark, toggleTheme: context.toggleTheme };
}
