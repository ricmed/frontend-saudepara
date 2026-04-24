import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
// Quando apontamos para um ambiente implantado (hml/trein/prod), não devemos subir o preview server.
const useDeployedEnv = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: useDeployedEnv
    ? undefined
    : {
        // Em ambiente local, preferimos build em "development" para respeitar `.env.local`
        // (o build padrão usa mode=production e `.env.production` pode apontar para HML/PRD).
        command: process.env.CI
          ? 'npx cross-env VITE_DISABLE_SW=true npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort'
          : 'npm run build -- --mode development && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
