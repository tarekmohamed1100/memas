import crypto from 'node:crypto';
import { users } from './store';

export const OWNER_ID = 'owner';
export const OWNER_USERNAME = 'owner';

// حساب المالك من ADMIN_PASSWORD (مش مخزن في الملفات)
export const ownerUser = () => ({ id: OWNER_ID, username: OWNER_USERNAME, name: 'المالك', role: 'owner', disabled: false });

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${crypto.scryptSync(pw, salt, 64).toString('hex')}`;
}
export function verifyPassword(pw, stored) {
  const [alg, salt, hash] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const got = crypto.scryptSync(String(pw), salt, 64);
  const want = Buffer.from(hash, 'hex');
  return want.length === got.length && crypto.timingSafeEqual(got, want);
}

export const publicUser = (u) => ({
  id: u.id, username: u.username, name: u.name, role: u.role, disabled: !!u.disabled,
  createdAt: u.createdAt || null, lastLoginAt: u.lastLoginAt || null,
});

export async function findByUsername(username) {
  return (await users.read()).find((u) => u.username === username) || null;
}
export async function findById(id) {
  return (await users.read()).find((u) => u.id === id) || null;
}
export async function listUsers() {
  return (await users.read()).map(publicUser);
}
export async function touchLogin(id) {
  await users.mutate((list) => list.map((u) => (u.id === id ? { ...u, lastLoginAt: new Date().toISOString() } : u)));
}

export function validateNewUser({ name, username, password }) {
  if (!name || name.length > 40) return 'invalid_name';
  if (!/^[a-z0-9_.-]{3,30}$/.test(username) || username === OWNER_USERNAME) return 'invalid_username';
  if (password.length < 8 || password.length > 200) return 'weak_password';
  return null;
}
export const validatePassword = (pw) => (pw.length >= 8 && pw.length <= 200 ? null : 'weak_password');

export async function createUser({ name, username, password }) {
  let created = null;
  let taken = false;
  await users.mutate((list) => {
    if (list.some((u) => u.username === username)) { taken = true; return list; }
    created = {
      id: crypto.randomBytes(8).toString('hex'), name, username, role: 'editor',
      passwordHash: hashPassword(password), disabled: false, createdAt: new Date().toISOString(),
    };
    return [...list, created];
  });
  if (taken) return { error: 'username_taken' };
  return { user: publicUser(created) };
}

export async function setUserStatus(id, disabled) {
  let found = false;
  await users.mutate((list) => list.map((u) => { if (u.id !== id) return u; found = true; return { ...u, disabled }; }));
  return found;
}
export async function setUserPassword(id, password) {
  let found = false;
  await users.mutate((list) => list.map((u) => { if (u.id !== id) return u; found = true; return { ...u, passwordHash: hashPassword(password), passwordChangedAt: new Date().toISOString() }; }));
  return found;
}
