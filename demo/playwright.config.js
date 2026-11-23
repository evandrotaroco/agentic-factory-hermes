import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173/';

export default defineConfig({
  testDir: 'tests',
  testMatch: ['**/e2e/**/*.spec.js', '**/acceptance/**/*.spec.js'],
  use: { baseURL, browserName: 'chromium' },
  webServer: {
    command: 'python3 -m http.server --bind 127.0.0.1 --directory public 4173',
    url: baseURL,
    reuseExistingServer: false,
  },
});
