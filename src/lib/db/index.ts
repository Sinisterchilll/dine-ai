import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'dineai.db');

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('busy_timeout = 10000');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
