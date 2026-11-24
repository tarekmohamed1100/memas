/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)', ink: 'var(--ink)', muted: 'var(--muted)',
        line: 'var(--line)', accent: 'var(--accent)', onaccent: 'var(--on-accent)', danger: 'var(--danger)',
      },
    },
  },
  plugins: [],
};
