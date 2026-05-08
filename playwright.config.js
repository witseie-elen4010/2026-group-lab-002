const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'node app.js',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});