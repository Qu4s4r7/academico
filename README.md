# Gestión académica (Fastify + PostgreSQL + React)

## 1. PostgreSQL en Fedora (una sola vez)
```bash
sudo dnf install -y nodejs npm postgresql-server postgresql
sudo postgresql-setup --initdb
sudo sed -i 's/ident$/scram-sha-256/' /var/lib/pgsql/data/pg_hba.conf   # permite login con contraseña en localhost
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE USER academico WITH PASSWORD 'cambia_esta_clave';"
sudo -u postgres psql -c "CREATE DATABASE gestion_academica OWNER academico;"
```

## 2. Backend (http://localhost:3000)
```bash
cd backend
cp .env.example .env      # edita DB_PASSWORD y JWT_SECRET
npm install
npm run setup             # crea las 9 tablas y el usuario administrador
npm run dev
```

## 3. Frontend (http://localhost:5173)
```bash
cd frontend
npm install
npm run dev
```

Ingreso: `admin@universidad.edu` / `admin123` (cámbialo en `.env` con ADMIN_EMAIL / ADMIN_PASSWORD antes de `npm run setup`).

## Notas
- Todo usuario autenticado tiene acceso total: no hay roles (el esquema no los define).
- `npm run setup` es repetible: no borra datos ni vuelve a crear lo que ya existe.
- Endpoints: `/api/auth/login`, `/api/auth/me`, `/api/dashboard/stats`, `/api/consultas/:nombre`,
  y para cada entidad `/api/:entidad` (GET, POST), `/api/:entidad/:id` (GET, PUT, DELETE), `/api/:entidad/options`.
  Entidades: usuarios, docentes, estudiantes, programas, asignaturas, grupos, matriculas, calificaciones, tipos-documento.
