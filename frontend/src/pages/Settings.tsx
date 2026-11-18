import { LogOut } from 'lucide-react';
import { useAuth } from '../auth';

function expiry(): string {
  try {
    const p = JSON.parse(atob(localStorage.getItem('token')!.split('.')[1]));
    return new Date(p.exp * 1000).toLocaleString();
  } catch { return '—'; }
}

export default function Settings() {
  const { user, logout } = useAuth();
  return (
    <>
      <h1>Configuración</h1>
      <p className="muted">Tu cuenta y sesión.</p>
      <div className="card pad">
        <p><strong>{user.nombres} {user.apellidos}</strong></p>
        <p className="muted">{user.correo}</p>
        <p className="muted">La sesión vence: {expiry()}</p>
        <button className="btn" onClick={logout}><LogOut size={16} /> Cerrar sesión</button>
      </div>
    </>
  );
}
