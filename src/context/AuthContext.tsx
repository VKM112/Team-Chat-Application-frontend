import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import type { AuthContextType, User } from '../types';
import api from '../services/api';

const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(
    storedUser ? JSON.parse(storedUser) as User : null
  );
  const [accessToken, setAccessToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  );

  const persistUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    persistUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, [persistUser]);

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        logout();
        return;
      }

      const { data } = await api.post('/auth/refresh', { refreshToken });
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  useEffect(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && !accessToken) {
      refreshAccessToken().catch(() => {});
    }
  }, [accessToken, refreshAccessToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post('/auth/login', { email, password });
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      persistUser(data.user);
    },
    [persistUser]
  );

  const signup = useCallback(
    async (username: string, email: string, password: string) => {
      const { data } = await api.post('/auth/signup', { username, email, password });
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      persistUser(data.user);
    },
    [persistUser]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken),
      login,
      signup,
      logout,
      refreshAccessToken
    }),
    [accessToken, login, logout, refreshAccessToken, signup, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
