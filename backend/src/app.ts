import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { pool } from './db.js';
import { entities, queries, filterDefs, Entity } from './entities.js';
import { pgMessage } from './errors.js';

export async function buildApp() {
  const app = Fastify();
  await app.register(cors, { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET', 'POST', 'PUT', 'DELETE'] });
  await app.register(jwt, { secret: process.env.JWT_SECRET!, sign: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } });

  app.setErrorHandler((err: any, _req, reply) => {
    const m = pgMessage(err);
    if (m) return reply.code(m.status).send({ message: m.message });
    if (err.statusCode && err.statusCode < 500) return reply.code(err.statusCode).send({ message: err.message });
    console.error(err);
    return reply.code(500).send({ message: 'Error interno del servidor' });
  });

  const auth = async (req: any, reply: any) => {
    try { await req.jwtVerify(); }
    catch { return reply.code(401).send({ message: 'Sesión expirada o no autorizada' }); }
  };
  const priv = { preHandler: auth };

  // ---------- Auth ----------
  app.post('/api/auth/login', async (req, reply) => {
    const { correo, password } = (req.body || {}) as any;
    if (!correo || !password) return reply.code(400).send({ message: 'Correo y contraseña son obligatorios' });
    const { rows } = await pool.query(
      'SELECT id_usuario, nombres, apellidos, correo, password_hash FROM usuario WHERE lower(correo) = lower($1)', [correo]);
    const u = rows[0];
    const ok = u && (await bcrypt.compare(String(password), u.password_hash));
    if (!ok) return reply.code(401).send({ message: 'Credenciales incorrectas' });
    const token = app.jwt.sign({ id: u.id_usuario, correo: u.correo });
    return { token, user: { id: u.id_usuario, nombres: u.nombres, apellidos: u.apellidos, correo: u.correo } };
  });

  app.get('/api/auth/me', priv, async (req: any, reply) => {
    const { rows } = await pool.query('SELECT id_usuario AS id, nombres, apellidos, correo FROM usuario WHERE id_usuario = $1', [req.user.id]);
    if (!rows[0]) return reply.code(401).send({ message: 'Sesión expirada o no autorizada' });
    return rows[0];
  });

  // ---------- Metadatos para que el frontend dibuje los formularios ----------
  app.get('/api/meta', priv, async () => ({
    entities: Object.fromEntries(Object.entries(entities).map(([k, e]) => [k, {
      title: e.title, fields: e.fields, cols: e.cols.map(([, alias, label]) => ({ key: alias, label })),
    }])),
    queries: Object.fromEntries(Object.entries(queries).map(([k, q]) => [k, { title: q.title, filters: Object.keys(q.filters) }])),
    filterDefs,
  }));

  // ---------- Dashboard ----------
  app.get('/api/dashboard/stats', priv, async () => {
    const count = async (t: string) => (await pool.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n;
    const [estudiantes, docentes, programas, asignaturas, grupos, matriculas] = await Promise.all(
      ['estudiante', 'docente', 'programa', 'asignatura', 'grupo', 'matricula'].map(count));
    const prom = (await pool.query('SELECT round(avg(nota), 2) AS prom FROM calificacion')).rows[0].prom;
    const recientes = (await pool.query(
      `SELECT u.nombres || ' ' || u.apellidos AS estudiante, a.nombre AS asignatura, g.periodo, m.fecha_matricula AS fecha
       FROM matricula m JOIN estudiante e ON e.id_estudiante = m.id_estudiante JOIN usuario u ON u.id_usuario = e.id_usuario
       JOIN grupo g ON g.id_grupo = m.id_grupo JOIN asignatura a ON a.id_asignatura = g.id_asignatura
       ORDER BY m.id_matricula DESC LIMIT 8`)).rows;
    return { counts: { estudiantes, docentes, programas, asignaturas, grupos, matriculas }, promedio: prom, recientes };
  });

  // ---------- Consultas ----------
  app.get('/api/consultas/:name', priv, async (req: any, reply) => {
    const qd = queries[req.params.name];
    if (!qd) return reply.code(404).send({ message: 'Consulta no encontrada' });
    const where: string[] = []; const params: any[] = [];
    for (const [p, col] of Object.entries(qd.filters)) {
      const v = req.query[p];
      if (v) { params.push(p === 'periodo' ? String(v) : Number(v)); where.push(`${col} = $${params.length}`); }
    }
    const sql = `${qd.sql} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ${qd.order} LIMIT 500`;
    return (await pool.query(sql, params)).rows;
  });

  // ---------- CRUD genérico ----------
  const getEntity = (req: any, reply: any): Entity | null => {
    const e = entities[req.params.key];
    if (!e) { reply.code(404).send({ message: 'Recurso no encontrado' }); return null; }
    return e;
  };

  function build(e: Entity, body: any, create: boolean) {
    const cols: string[] = []; const vals: any[] = [];
    for (const f of e.fields) {
      let v = body?.[f.name];
      const empty = v === undefined || v === null || String(v).trim() === '';
      const col = f.column || f.name;
      if (empty) {
        if (f.hash && !create) continue;
        if (f.required) return { error: `Todos los campos obligatorios deben completarse (${f.label})` };
        if (create) continue;
        cols.push(col); vals.push(null); continue;
      }
      if (f.type === 'number' || f.type === 'select') {
        const n = Number(v);
        if (!Number.isFinite(n)) return { error: `${f.label} debe ser un número válido` };
        if (f.type === 'select' || !f.decimal) { if (!Number.isInteger(n)) return { error: `${f.label} debe ser un número entero` }; }
        if (f.min !== undefined && n < f.min || f.maxVal !== undefined && n > f.maxVal)
          return { error: f.name === 'nota' ? 'La nota debe encontrarse dentro del rango permitido (0 a 5)'
            : `${f.label} debe estar entre ${f.min} y ${f.maxVal}` };
        v = n;
      } else {
        v = String(v).trim();
        if (f.max && v.length > f.max && !f.hash) return { error: `${f.label} no puede superar ${f.max} caracteres` };
        if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { error: 'El correo electrónico no es válido' };
        if (f.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(Date.parse(v)))) return { error: `${f.label} no es una fecha válida` };
        if (f.hash) { if (v.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres' }; v = bcrypt.hashSync(v, 10); }
      }
      cols.push(col); vals.push(v);
    }
    return { cols, vals };
  }

  app.get('/api/:key/options', priv, async (req: any, reply) => {
    const e = getEntity(req, reply); if (!e) return;
    return (await pool.query(`SELECT t.${e.pk} AS id, ${e.label} AS label FROM ${e.from} ORDER BY label LIMIT 1000`)).rows;
  });

  app.get('/api/:key', priv, async (req: any, reply) => {
    const e = getEntity(req, reply); if (!e) return;
    const { q, page, ...rest } = req.query;
    const size = 10; const p = Math.max(1, parseInt(page) || 1);
    const params: any[] = []; const where: string[] = [];
    if (q) {
      params.push(`%${q}%`);
      const n = params.length;
      where.push('(' + e.search.map((s) => `${s}::text ILIKE $${n}`).join(' OR ') + ')');
    }
    for (const f of e.fields) {
      if (f.type === 'select' && rest[f.name]) { params.push(Number(rest[f.name])); where.push(`t.${f.name} = $${params.length}`); }
    }
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const select = e.cols.map(([x, a]) => `${x} AS "${a}"`).join(', ');
    const total = (await pool.query(`SELECT count(*)::int AS n FROM ${e.from} ${w}`, params)).rows[0].n;
    const { rows } = await pool.query(
      `SELECT ${select} FROM ${e.from} ${w} ORDER BY t.${e.pk} DESC LIMIT ${size} OFFSET ${(p - 1) * size}`, params);
    return { rows, total, size };
  });

  app.get('/api/:key/:id', priv, async (req: any, reply) => {
    const e = getEntity(req, reply); if (!e) return;
    const { rows } = await pool.query(`SELECT * FROM ${e.table} WHERE ${e.pk} = $1`, [Number(req.params.id)]);
    if (!rows[0]) return reply.code(404).send({ message: 'Registro no encontrado' });
    delete rows[0].password_hash;
    return rows[0];
  });

  app.post('/api/:key', priv, async (req: any, reply) => {
    const e = getEntity(req, reply); if (!e) return;
    const r: any = build(e, req.body, true);
    if (r.error) return reply.code(400).send({ message: r.error });
    const ph = r.cols.map((_: any, i: number) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(`INSERT INTO ${e.table} (${r.cols.join(', ')}) VALUES (${ph}) RETURNING ${e.pk} AS id`, r.vals);
    return reply.code(201).send(rows[0]);
  });

  app.put('/api/:key/:id', priv, async (req: any, reply) => {
    const e = getEntity(req, reply); if (!e) return;
    const r: any = build(e, req.body, false);
    if (r.error) return reply.code(400).send({ message: r.error });
    if (!r.cols.length) return reply.code(400).send({ message: 'No hay cambios para guardar' });
    const set = r.cols.map((c: string, i: number) => `${c} = $${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE ${e.table} SET ${set} WHERE ${e.pk} = $${r.cols.length + 1} RETURNING ${e.pk} AS id`, [...r.vals, Number(req.params.id)]);
    if (!rows[0]) return reply.code(404).send({ message: 'Registro no encontrado' });
    return rows[0];
  });

  app.delete('/api/:key/:id', priv, async (req: any, reply) => {
    const e = getEntity(req, reply); if (!e) return;
    try {
      const { rowCount } = await pool.query(`DELETE FROM ${e.table} WHERE ${e.pk} = $1`, [Number(req.params.id)]);
      if (!rowCount) return reply.code(404).send({ message: 'Registro no encontrado' });
      return reply.code(204).send();
    } catch (err: any) {
      if (err.code === '23503')
        return reply.code(409).send({ message: 'No se puede eliminar este registro porque tiene otros registros asociados (por ejemplo estudiantes, grupos o matrículas)' });
      throw err;
    }
  });

  return app;
}
