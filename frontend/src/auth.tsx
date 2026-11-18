import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, resetMeta } from './api';

const Ctx = createContext<any>(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/auth/me').then((r) => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const login = async (correo: string, password: string) => {
    const r = await api.post('/auth/login', { correo, password });
    localStorage.setItem('token', r.data.token);
    resetMeta();
    setUser(r.data.user);
  };
  const logout = () => { localStorage.removeItem('token'); resetMeta(); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}
