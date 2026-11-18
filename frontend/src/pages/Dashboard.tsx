import { useEffect, useState } from 'react';
import { GraduationCap, UserSquare, BookMarked, BookOpen, Layers, ClipboardList, Award } from 'lucide-react';
import { api, errMsg } from '../api';

const cards = [
  ['estudiantes', 'Estudiantes', GraduationCap], ['docentes', 'Docentes', UserSquare], ['programas', 'Programas', BookMarked],
  ['asignaturas', 'Asignaturas', BookOpen], ['grupos', 'Grupos', Layers], ['matriculas', 'Matrículas', ClipboardList],
] as const;

export default function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/dashboard/stats').then((r) => setD(r.data)).catch((e) => setError(errMsg(e))); }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!d) return <p className="muted">Cargando…</p>;
  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted">Resumen en tiempo real de la base de datos.</p>
      <div className="stats">
        {cards.map(([k, label, Icon]) => (
          <div className="card stat" key={k}>
            <div className="stat-icon"><Icon size={20} /></div>
            <div><div className="stat-n">{d.counts[k]}</div><div className="muted">{label}</div></div>
          </div>
        ))}
        <div className="card stat">
          <div className="stat-icon"><Award size={20} /></div>
          <div><div className="stat-n">{d.promedio ?? '—'}</div><div className="muted">Promedio de calificaciones</div></div>
        </div>
      </div>
      <h2>Matrículas recientes</h2>
      <div className="card table-wrap">
        {d.recientes.length === 0 ? <p className="empty">Aún no hay matrículas registradas.</p> : (
          <table>
            <thead><tr><th>Estudiante</th><th>Asignatura</th><th>Periodo</th><th>Fecha</th></tr></thead>
            <tbody>{d.recientes.map((r: any, i: number) => (
              <tr key={i}><td>{r.estudiante}</td><td>{r.asignatura}</td><td>{r.periodo}</td><td>{r.fecha}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
