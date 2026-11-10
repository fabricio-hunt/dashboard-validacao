/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sap: {
          primary: '#0057d2',
          'primary-deep': '#0040b0',
          'on-primary': '#ffffff',
          navy: '#022879',
          sky: '#6bc0ff',
          canvas: '#ffffff',
          chrome: '#f5f6f7',
          band: '#eaecee',
          'band-blue': '#ebf8ff',
          'band-lavender': '#f7f4ff',
          ink: '#000000',
          'ink-lead': '#3c3c3c',
          'ink-body': '#223548',
          'ink-list': '#354a5f',
          'ink-meta': '#475e75',
          'ink-nav': '#545454',
          hairline: '#d5dce2',
          'hairline-strong': '#475e75',
        },
      },
      borderRadius: {
        sap: '8px',
        'sap-lg': '12px',
      },
    },
  },
  plugins: [],
}
