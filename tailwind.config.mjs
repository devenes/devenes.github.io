/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#050811',
        cosmic: '#0A1124',
        cluster: {
          ai: '#38BDF8',
          aiLight: '#60A5FA',
          k8s: '#F59E0B',
          k8sLight: '#FBBF24',
          cloud: '#FACC15',
          cloudLight: '#FB923C',
          workshops: '#10B981',
          workshopsLight: '#34D399',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
