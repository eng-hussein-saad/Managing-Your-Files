import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  projects: [
    {
      name: 'local',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'unrelated-origins',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:3000',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:3000',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        baseURL: 'http://localhost:3000',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'chrome-desktop',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
        channel: 'chrome',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'edge-desktop',
      use: {
        ...devices['Desktop Edge'],
        baseURL: 'http://localhost:3000',
        channel: 'msedge',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'mobile-webkit',
      use: {
        ...devices['iPhone 14'],
        baseURL: 'http://localhost:3000',
      },
    },
  ],
  use: { trace: 'retain-on-failure' }
});

