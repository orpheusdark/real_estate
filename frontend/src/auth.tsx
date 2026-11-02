import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type User } from './api';
const Context = createContext<{
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
}>({ user: null, loading: true, setUser: () => {}, logout: async () => {} });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get('/users/me')
      .then((r) => setUser(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }
  return <Context.Provider value={{ user, loading, setUser, logout }}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
