import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./setup/testSetup.js'],
    globals: false,
    passWithNoTests: true,
    hookTimeout: 60000,
  },
})
