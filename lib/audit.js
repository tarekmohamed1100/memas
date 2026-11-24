import crypto from 'node:crypto';
import { activity } from './store';

// سجل العمليات: مين عمل إيه ومتى. بيفضل آخر 1000 عملية
export async function audit(user, action, detail = {}) {
  try {
    const entry = {
      id: crypto.randomBytes(6).toString('hex'),
      at: new Date().toISOString(),
      user: user?.username || '?',
      name: user?.name || '',
      action,
      detail,
    };
    await activity.mutate((list) => [entry, ...list].slice(0, 1000));
  } catch {
    // السجل مايوقفش العملية الأساسية
  }
}
