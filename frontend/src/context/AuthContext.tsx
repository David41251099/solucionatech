import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '../types';
import * as authService from '../services/auth.service';
import { connectSocket, disconnectSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  fetchCurrentUser: () => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async (): Promise<User> => {
    const profile = await authService.fetchCurrentUser();
    setUser(profile);
    setToken(authService.getToken());
    return profile;
  }, []);

  const restoreSession = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const savedToken = authService.getToken();

      if (!savedToken) {
        setUser(null);
        setToken(null);
        return;
      }

      setToken(savedToken);
      await fetchCurrentUser();
    } catch {
      authService.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (token) {
      connectSocket();
      return;
    }

    disconnectSocket();
  }, [token]);

  useEffect(() => {
    const savedToken = authService.getToken();
    if (savedToken) {
      connectSocket();
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const response: AuthResponse = await authService.login(credentials);
    setUser(response.user);
    setToken(response.token);
    connectSocket();
  };

  const register = async (data: RegisterData): Promise<void> => {
    const response: AuthResponse = await authService.register(data);
    setUser(response.user);
    setToken(response.token);
    connectSocket();
  };

  const logout = (): void => {
    disconnectSocket();
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    restoreSession,
    fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
