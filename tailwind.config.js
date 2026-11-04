/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        fun: ['Fredoka', 'Baloo 2', 'Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      colors: {
        game: {
          bg: '#F0F9FF',
          card: '#FFFFFF',
          primary: '#4F46E5',
          primaryHover: '#4338CA',
          accent: '#F59E0B',
          accentHover: '#D97706',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B',
          heart: '#EC4899',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
        }
      },
      boxShadow: {
        'bouncy': '0 6px 0 0 rgba(0, 0, 0, 0.15)',
        'bouncy-active': '0 2px 0 0 rgba(0, 0, 0, 0.15)',
        'bouncy-primary': '0 6px 0 0 #3730A3',
        'bouncy-accent': '0 6px 0 0 #B45309',
        'bouncy-success': '0 6px 0 0 #047857',
        'bouncy-heart': '0 6px 0 0 #BE185D',
      }
    },
  },
  plugins: [],
}
