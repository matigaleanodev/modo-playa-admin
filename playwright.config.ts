import { defineConfig } from '@playwright/test';

const port = Number(process.env.E2E_PORT ?? 4301);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  webServer: {
    command: `npm run start -- --host 127.0.0.1 --port ${port}`,
    url: `${baseURL}/auth/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  reporter: [['list']],
});
