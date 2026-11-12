/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      opacity: {
        12: '0.12',
        14: '0.14',
        16: '0.16',
        18: '0.18',
        88: '0.88',
        92: '0.92',
        96: '0.96',
        98: '0.98',
      },
      colors: {
        obsidian: '#0B0C0E',
        surface: '#121417',
        surfaceRaised: '#181B20',
        paper: '#F4F1EA',
        brass: '#E2A84B',
        brassSoft: '#F3D08A',
        cluster: {
          ai: '#E2A84B',
          aiLight: '#F3D08A',
          k8s: '#7DA2C8',
          k8sLight: '#A5C1DF',
          cloud: '#C89D7C',
          cloudLight: '#E0BCA0',
          workshops: '#6BA38B',
          workshopsLight: '#8FC0AA',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        display: ['Newsreader', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: [
          'IBM Plex Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
