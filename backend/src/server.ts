import { buildApp } from './app.js';
import { pool } from './db.js';

if (!process.env.JWT_SECRET) { console.error('Falta JWT_SECRET en .env'); process.exit(1); }
await pool.query('SELECT 1').catch((e) => { console.error('No se pudo conectar a PostgreSQL:', e.message); process.exit(1); });
const app = await buildApp();
const port = Number(process.env.PORT || 3000);
await app.listen({ port, host: '0.0.0.0' });
console.log(`API lista en http://localhost:${port}`);
