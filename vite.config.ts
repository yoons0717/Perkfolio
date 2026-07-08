import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // .claude/worktrees holds sibling git worktrees for other in-progress
    // branches — without this, their test files get picked up too.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
})
