import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

// App icons are generated from public/pwa-icon.svg (full-bleed navy, W inside the maskable safe zone).
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    maskable: { ...preset.maskable, padding: 0, resizeOptions: { background: '#172554' } },
    apple: { ...preset.apple, padding: 0, resizeOptions: { background: '#172554' } },
  },
  images: ['public/pwa-icon.svg'],
});
