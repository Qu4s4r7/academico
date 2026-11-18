import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && !String(e.config?.url).includes('/auth/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(e);
  }
);

export const errMsg = (e: any): string => e?.response?.data?.message || 'No se pudo conectar con el servidor';

let metaPromise: Promise<any> | null = null;
export const getMeta = () => (metaPromise ??= api.get('/meta').then((r) => r.data).catch((e) => { metaPromise = null; throw e; }));
export const resetMeta = () => { metaPromise = null; };
