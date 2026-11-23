import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173/';

export default defineConfig({
  testDir: 'tests',
  testMatch: ['**/e2e/**/*.spec.js', '**/acceptance/**/*.spec.js'],
  use: { baseURL, browserName: 'chromium' },
  webServer: {
    // Keep http.server's CLI, but give concurrent Chromium connections room to queue.
    command: 'python3 -c "import runpy, socketserver; socketserver.TCPServer.request_queue_size = 128; '
      + 'runpy.run_module(\'http.server\', run_name=\'__main__\', alter_sys=True)" --bind 127.0.0.1 --directory public 4173',
    url: baseURL,
    reuseExistingServer: false,
  },
});
