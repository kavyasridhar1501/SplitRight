import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'slate-base': '#0d1117',
        'slate-surface': '#161b22',
        'slate-elevated': '#1f2937',
        'slate-border': '#2d3748',
        // Sage Accents
        'sage': '#6b9e78',
        'sage-soft': '#4a7c59',
        'sage-subtle': '#1e3a2a',
        'sage-glow': 'rgba(107, 158, 120, 0.125)',
        // Semantic
        'positive': '#5a9e7a',
        'negative': '#c17b6b',
        'neutral-muted': '#64748b',
        'warning': '#c4a35a',
        // Typography
        'text-primary': '#e2e8f0',
        'text-secondary': '#94a3b8',
        'text-muted': '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'input': '10px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px #2d3748',
        'card-elevated': '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px #2d3748',
      },
      maxWidth: {
        'mobile': '430px',
      },
    },
  },
  plugins: [],
};

export default config;
