import fs from 'node:fs/promises';
import path from 'node:path';
import { config, DEFAULT_CATEGORIES } from './config';

// مخزن JSON بكتابة ذرّية وطابور كتابة واحد. محفوظ على globalThis عشان Next ميعملش نسخ مكررة
export function makeStore(name, seed = []) {
  const file = path.join(config.dataDir, name);
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

const S = (globalThis.__memasStores ??= {});
S.photos ??= makeStore('photos.json');
S.comments ??= makeStore('comments.json');
S.users ??= makeStore('users.json');
S.activity ??= makeStore('activity.json');
S.waEvents ??= makeStore('wa-events.json');
S.categories ??= makeStore('categories.json', DEFAULT_CATEGORIES.map((c) => ({ ...c })));
export const photos = S.photos;
export const comments = S.comments;
export const users = S.users;
export const activity = S.activity;
export const waEvents = S.waEvents;
export const categories = S.categories;
