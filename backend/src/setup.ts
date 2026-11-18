import fs from 'fs';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const sql = fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
await pool.query(sql);
console.log('✔ Tablas creadas (o ya existían)');

const email = process.env.ADMIN_EMAIL || 'admin@universidad.edu';
const pass = process.env.ADMIN_PASSWORD || 'admin123';
const exists = await pool.query('SELECT 1 FROM usuario WHERE lower(correo)=lower($1)', [email]);
if (exists.rowCount === 0) {
  const tipo = (await pool.query('SELECT id_tipo_documento FROM tipo_documento ORDER BY 1 LIMIT 1')).rows[0];
  await pool.query(
    `INSERT INTO usuario (id_tipo_documento, numero_documento, nombres, apellidos, correo, password_hash)
     VALUES ($1, '0000000000', 'Administrador', 'Sistema', $2, $3)`,
    [tipo.id_tipo_documento, email, bcrypt.hashSync(pass, 10)]
  );
  console.log(`✔ Usuario administrador creado: ${email}`);
} else {
  console.log('✔ El usuario administrador ya existía');
}
await pool.end();
