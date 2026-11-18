import pg from 'pg';
import 'dotenv/config';

pg.types.setTypeParser(1082, (v: string) => v); // DATE como texto YYYY-MM-DD
pg.types.setTypeParser(1700, (v: string) => parseFloat(v)); // NUMERIC como número
pg.types.setTypeParser(20, (v: string) => parseInt(v, 10)); // BIGINT como número

export const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
