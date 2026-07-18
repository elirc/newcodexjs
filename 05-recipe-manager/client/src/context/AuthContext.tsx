import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken } from '../services/api';
import type { User } from '../types/recipe';

type AuthContextValue = {
  user?: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { username: string; email: string; password: string; displayName?: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Provides auth state and actions backed by cookie refresh plus in-memory access token. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((payload: { user: User; accessToken: string }) => {
    setUser(payload.user);
    setAccessToken(payload.accessToken);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      applySession(data.data);
    } catch {
      setAccessToken(undefined);
      setUser(undefined);
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        applySession(data.data);
      },
      register: async (input) => {
        const { data } = await api.post('/auth/register', input);
        applySession(data.data);
      },
      logout: async () => {
        await api.post('/auth/logout');
        setUser(undefined);
        setAccessToken(undefined);
      }
    }),
    [applySession, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Reads the current auth context and fails loudly when missing. */
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
