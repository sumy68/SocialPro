import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const DB_PATH = process.env.DATABASE_URL || join(process.cwd(), 'data', 'socialpro.db');

// Ensure data directory exists
import { mkdirSync } from 'fs';
try {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true });
} catch (e) {}

export const db = new Database(DB_PATH, { verbose: console.log });

// Initialize schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

console.log('[DB] Database initialized at:', DB_PATH);

export interface ScheduledPost {
  id: string;
  user_id: string;
  platform: string;
  caption: string;
  media_urls: string | null;
  media_type: string | null;
  content_type: string | null;
  scheduled_date: string;
  status: 'scheduled' | 'published' | 'failed';
  access_token: string;
  platform_user_id: string | null;
  created_at: string;
  published_at: string | null;
  error_message: string | null;
}
