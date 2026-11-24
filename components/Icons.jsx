const P = {
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  chat: <path d="M5 3h14a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H10l-5 4v-4a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" />,
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  tiktok: (<><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.4 2.6 2.1 4.2 5 4.4" /></>),
  whatsapp: <path d="M3 21l1.7-5.1A9 9 0 1 1 8 19.3L3 21z" />,
};

export function Icon({ name, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {P[name]}
    </svg>
  );
}
