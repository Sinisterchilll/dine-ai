import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!, {
  max: 1,        // keep connection count low in serverless
  ssl: 'require',
  prepare: false, // required for Supabase transaction pooler (PgBouncer)
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
