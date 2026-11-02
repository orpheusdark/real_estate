import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from './api';
const Runtime = createContext('unknown');
export function RuntimeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState('unknown');
  useEffect(() => {
    api
      .get('/health')
      .then((r) => setMode(r.data.mode))
      .catch(() => {});
  }, []);
  return <Runtime.Provider value={mode}>{children}</Runtime.Provider>;
}
export const useRuntime = () => useContext(Runtime);
