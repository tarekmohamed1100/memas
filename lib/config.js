import path from 'node:path';

export const config = {
  studio: 'Location Memas',
  phone: process.env.WHATSAPP_PHONE || '201149094108',
  message: 'مرحبًا، عجبتني الصورة رقم {n} وحابب أعرف التفاصيل.',
  social: {
    facebook: 'https://www.facebook.com/share/1DmpQSqGKb/',
    tiktok: 'https://www.tiktok.com/@ahmedmemas3',
    // رابط واتساب بيزنس (بيفتح الشات من غير رسالة جاهزة)
    whatsapp: 'https://wa.me/message/2PJB5QEVBI2WK1',
  },
  // عنوان الاستوديو (لو فاضي القسم مايظهرش)
  address: '',
  hours: '',
  mapUrl: '',
  dataDir: path.resolve(process.env.DATA_DIR || './data'),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  sessionSecret: process.env.SESSION_SECRET || '',
  trustProxy: process.env.TRUST_PROXY === '1',
  isProd: process.env.NODE_ENV === 'production',
};

// الأقسام الافتراضية بتتحط أول مرة بس. بعد كده الأقسام بتتدار من لوحة الأدمن
export const DEFAULT_CATEGORIES = [
  { key: 'events', label: 'مناسبات' },
  { key: 'places', label: 'أماكن' },
];

export const configOk = () => Boolean(config.adminPassword) && config.sessionSecret.length >= 32;

export const waLink = (n) =>
  `https://wa.me/${config.phone}?text=${encodeURIComponent(config.message.replace('{n}', n))}`;
