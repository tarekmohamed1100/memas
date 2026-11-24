import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import { config, DEFAULT_CATEGORIES } from './config';

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.STORAGE_URL || '';
const usePg = Boolean(DB_URL);
if (process.env.VERCEL && !usePg) throw new Error('على Vercel لازم تربط قاعدة بيانات Neon بالمشروع');

// تخزين محلي على القرص (للتشغيل على جهازك)
function fileStore(key, seed) {
  const file = path.join(config.dataDir, `${key}.json`);
  let data = null;
  let chain = Promise.resolve();
  async function write(list) {
    await fs.mkdir(config.dataDir, { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(list));
    await fs.rename(tmp, file);
  }
  async function load() {
    if (data) return data;
    try { data = JSON.parse(await fs.readFile(file, 'utf8')); }
    catch (e) { if (e.code !== 'ENOENT') throw e; data = seed.slice(); await write(data); }
    return data;
  }
  return {
    read: async () => (await load()).slice(),
    mutate(fn) {
      const run = chain.then(async () => {
        const cur = await load();
        const next = await fn(cur.slice());
        await write(next);
        data = next;
        return next;
      });
      chain = run.catch(() => {});
      return run;
    },
  };
}

// تخزين دائم على Neon Postgres (كل مجموعة بيانات صف واحد جوه جدول واحد)
let pool = null;
const getPool = () => (pool ??= new pg.Pool({
  connectionString: DB_URL,
  max: 3,
  ssl: /localhost|127\.0\.0\.1/.test(DB_URL) ? false : { rejectUnauthorized: false },
}));

let schema = null;
const ensureSchema = () => (schema ??= getPool()
  .query('CREATE TABLE IF NOT EXISTS memas_docs (name text PRIMARY KEY, data jsonb NOT NULL)')
  .catch((e) => { schema = null; throw e; }));

function pgStore(key, seed) {
  let seeded = null;
  const init = () => (seeded ??= ensureSchema()
    .then(() => getPool().query('INSERT INTO memas_docs (name, data) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING', [key, JSON.stringify(seed)]))
    .catch((e) => { seeded = null; throw e; }));
  return {
    async read() {
      await init();
      const r = await getPool().query('SELECT data FROM memas_docs WHERE name = $1', [key]);
      return r.rows[0]?.data ?? [];
    },
    async mutate(fn) {
      await init();
      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        const r = await client.query('SELECT data FROM memas_docs WHERE name = $1 FOR UPDATE', [key]);
        const next = await fn((r.rows[0]?.data ?? []).slice());
        await client.query('UPDATE memas_docs SET data = $2 WHERE name = $1', [key, JSON.stringify(next)]);
        await client.query('COMMIT');
        return next;
      } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
  };
}

const makeStore = usePg ? pgStore : fileStore;
const S = (globalThis.__memasStores ??= {});
S.photos ??= makeStore('photos', []);
S.comments ??= makeStore('comments', []);
S.users ??= makeStore('users', []);
S.activity ??= makeStore('activity', []);
S.waEvents ??= makeStore('wa-events', []);
S.categories ??= makeStore('categories', DEFAULT_CATEGORIES.map((c) => ({ ...c })));
S.limits ??= makeStore('ratelimits', []);
export const photos = S.photos;
export const comments = S.comments;
export const users = S.users;
export const activity = S.activity;
export const waEvents = S.waEvents;
export const categories = S.categories;
export const limits = S.limits;
