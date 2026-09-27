import { defineConfig } from 'vitest/config';

// Firestore security-rules tests. They need the Firestore emulator, so run
// them with `npm run test:rules` (which starts it) rather than `npm test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['rules-tests/**/*.test.ts'],
    testTimeout: 15000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
