import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [sveltekit()],

  test: {
    // Include test files
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],

    // Test environment
    environment: 'jsdom',

    // Global test setup
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.svelte-kit/',
        'build/',
        'tests/',
        '*.config.*',
      ],
    },
  },

  // Resolve path aliases (matches svelte.config.js)
  resolve: {
    alias: {
      $contracts: './contracts',
      $services: './services',
      $lib: './src/lib',
    },
  },
})
