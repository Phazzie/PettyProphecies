import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Preprocess Svelte files
  preprocess: vitePreprocess(),

  kit: {
    // Vercel adapter configuration
    adapter: adapter({
      runtime: 'nodejs20.x',
    }),

    // Path aliases for cleaner imports
    alias: {
      $contracts: './contracts',
      $services: './services',
      $lib: './src/lib',
    },

    // TypeScript checking
    typescript: {
      config(config) {
        return {
          ...config,
          include: [
            ...config.include,
            '../contracts/**/*.ts',
            '../services/**/*.ts',
          ],
        }
      },
    },
  },
}

export default config
