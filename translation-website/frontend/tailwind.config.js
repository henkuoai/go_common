/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        deepl: {
          blue: '#0F2B46',
          accent: '#0F2B96',
          border: '#E5E7EB',
          panel: '#F7F8FA',
          pro: '#0E9967',
          text: '#1F2937',
          muted: '#6B7280'
        }
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
