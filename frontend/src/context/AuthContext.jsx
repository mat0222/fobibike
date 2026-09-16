import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { DEMO_USER, IS_DEMO } from '../config/demo';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(IS_DEMO ? DEMO_USER : null);
  const [loading, setLoading] = useState(!IS_DEMO);

  const checkSession = useCallback(async () => {
    if (IS_DEMO) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    try {
      const data = await api.me();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (usuario, password) => {
    if (IS_DEMO) {
      setUser(DEMO_USER);
      return DEMO_USER;
    }

    const data = await api.login(usuario, password);
    setUser(data.user);
    return data.user;
  };

  const enterDemo = () => {
    setUser(DEMO_USER);
    return DEMO_USER;
  };

  const logout = async () => {
    if (IS_DEMO) {
      setUser(null);
      return;
    }

    try {
      await api.logout();
    } catch {
      // Si la sesion ya expiro, igual limpiamos el estado local
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      enterDemo,
      isAuthenticated: !!user,
      isDemo: IS_DEMO,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
