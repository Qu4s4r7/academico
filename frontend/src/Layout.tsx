import { useState, ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, UserSquare, BookMarked, BookOpen, Layers, ClipboardList, Award,
  FileSearch, Settings, IdCard, Menu, GraduationCap as Logo } from 'lucide-react';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/e/usuarios', label: 'Usuarios', icon: Users },
  { to: '/e/docentes', label: 'Docentes', icon: UserSquare },
  { to: '/e/estudiantes', label: 'Estudiantes', icon: GraduationCap },
  { to: '/e/programas', label: 'Programas', icon: BookMarked },
  { to: '/e/asignaturas', label: 'Asignaturas', icon: BookOpen },
  { to: '/e/grupos', label: 'Grupos', icon: Layers },
  { to: '/e/matriculas', label: 'Matrículas', icon: ClipboardList },
  { to: '/e/calificaciones', label: 'Calificaciones', icon: Award },
  { to: '/e/tipos-documento', label: 'Tipos de documento', icon: IdCard },
  { to: '/consultas', label: 'Consultas e informes', icon: FileSearch },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="shell">
      <aside className={'sidebar' + (open ? ' open' : '')}>
        <div className="brand"><Logo size={22} /> <span>Gestión académica</span></div>
        <nav>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => 'nav' + (isActive ? ' active' : '')}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu" onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu size={20} /></button>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
