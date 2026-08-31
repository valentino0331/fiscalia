import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL no está configurada. Define la conexión de Neon en el .env');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
