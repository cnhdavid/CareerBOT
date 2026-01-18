/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ai-primary': '#667eea',
        'ai-accent': '#764ba2',
        'ai-glow': 'rgba(102, 126, 234, 0.4)',
      },
      backgroundImage: {
        'gradient-ai': 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        'gradient-mesh': 'radial-gradient(at 20% 50%, rgba(102, 126, 234, 0.1) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(118, 75, 162, 0.1) 0px, transparent 50%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(102, 126, 234, 0.3)',
        'glow-sm': '0 0 10px rgba(102, 126, 234, 0.2)',
        'glass': '0 8px 32px rgba(31, 38, 135, 0.37)',
        'ai': '0 0 30px rgba(102, 126, 234, 0.4), inset 0 1px 0px rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'thinking': 'thinking 1.2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(102, 126, 234, 0.2)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 20px rgba(102, 126, 234, 0.4)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1200px 0' },
          '100%': { backgroundPosition: '1200px 0' },
        },
        'thinking': {
          '0%, 60%, 100%': { opacity: '1' },
          '30%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
