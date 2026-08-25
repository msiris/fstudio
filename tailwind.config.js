/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0A14',
        card: '#16142A',
        cardAlt: '#1E1B33',
        accent: '#7C4DFF',
        text: '#FFFFFF',
        muted: '#8B89A6',
        line: 'rgba(255,255,255,0.08)',
      },
      borderRadius: {
        card: '1rem',
      },
      height: {
        action: '3.5rem',
        field: '2.75rem',
      },
      maxWidth: {
        app: '28rem',
      },
    },
  },
  plugins: [],
};
