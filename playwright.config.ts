import { defineConfig, devices } from '@playwright/test';

const liveBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: liveBaseUrl || 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: liveBaseUrl
    ? undefined
    : {
        command: 'npm run build && npm run preview',
        url: 'http://localhost:4321',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
});
