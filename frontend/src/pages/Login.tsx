import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../auth';
import { errMsg } from '../api';

export default function Login() {
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('expired') ? 'Tu sesión expiró. Inicia sesión de nuevo.' : '');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(correo, password); }
    catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="center">
      <form className="card login" onSubmit={submit}>
        <div className="login-logo"><GraduationCap size={28} /></div>
        <h1>Gestión académica</h1>
        <p className="muted">Inicia sesión para continuar</p>
        {error && <div className="alert">{error}</div>}
        <label>Correo electrónico
          <input type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} autoFocus />
        </label>
        <label>Contraseña
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn primary" disabled={busy}>{busy ? 'Entrando…' : 'Iniciar sesión'}</button>
      </form>
    </div>
  );
}
