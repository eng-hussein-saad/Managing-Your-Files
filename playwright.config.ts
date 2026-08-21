import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  projects: [
    { name: 'local', use: { baseURL: 'http://localhost:3000' } },
    { name: 'unrelated-origins', use: { baseURL: 'http://127.0.0.1:3000' } }
  ],
  use: { trace: 'retain-on-failure' }
});

