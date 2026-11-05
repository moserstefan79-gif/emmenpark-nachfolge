/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#1F3D32', forestDeep: '#163028', card: '#27483B',
        gold: '#D4A23A', goldSoft: '#B8862A',
        cream: '#F2EFE6', sand: '#E8E2D3', muted: '#B8C7BD', ink: '#1B2420', inkSoft: '#5B6660',
      },
      fontFamily: { sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'], serif: ['"Source Serif 4"', 'Georgia', 'serif'] },
    },
  },
  plugins: [],
}
