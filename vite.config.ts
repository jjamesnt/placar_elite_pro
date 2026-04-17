import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        legacy({
          // James: Suporte ultra-amplo para TV Boxes (Chrome 50+, Android 5+)
          targets: ['chrome >= 50', 'android >= 5', 'safari >= 10'],
          additionalLegacyPolyfills: [
            'regenerator-runtime/runtime',
            'intersection-observer', // Polyfill para scroll e visibilidade
            'resize-observer-polyfill' // Polyfill para layouts responsivos
          ],
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
