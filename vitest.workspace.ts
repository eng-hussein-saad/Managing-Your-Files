import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  { test: { name: 'unit', include: ['server/tests/unit/**/*.test.ts', 'client/tests/unit/**/*.test.ts'] } },
  { test: { name: 'contract', fileParallelism: false, maxWorkers: 1, include: ['server/tests/contract/**/*.test.ts'] } },
  { test: { name: 'integration', fileParallelism: false, maxWorkers: 1, include: ['server/tests/integration/**/*.test.ts', 'client/tests/integration/**/*.test.ts'] } },
  { esbuild: { jsx: 'automatic' }, test: { name: 'component', environment: 'jsdom', include: ['client/tests/component/**/*.test.tsx'], setupFiles: ['client/tests/setup.ts'] } },
  { test: { name: 'security', fileParallelism: false, maxWorkers: 1, include: ['tests/security/**/*.test.ts', 'server/tests/security/**/*.test.ts'] } }
]);
