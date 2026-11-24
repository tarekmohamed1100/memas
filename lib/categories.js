import crypto from 'node:crypto';
import { categories } from './store';

export const listCategories = () => categories.read();
export const categoryKeys = async () => (await categories.read()).map((c) => c.key);

export const validLabel = (label) => label.length >= 1 && label.length <= 30;

export async function addCategory(label) {
  let created = null;
  let dup = false;
  await categories.mutate((list) => {
    if (list.some((c) => c.label === label)) { dup = true; return list; }
    created = { key: 'c' + crypto.randomBytes(4).toString('hex'), label };
    return [...list, created];
  });
  if (dup) return { error: 'category_exists' };
  return { category: created };
}

export async function removeCategory(key) {
  let found = false;
  await categories.mutate((list) => {
    const next = list.filter((c) => c.key !== key);
    found = next.length !== list.length;
    return next;
  });
  return found;
}
