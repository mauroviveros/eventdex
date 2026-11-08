import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// The seed talks to local Supabase with the keys of .env.local.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

/**
 * End-to-end walks of each slice against the local stack: `pnpm db:start`
 * and `pnpm dev` (reused if it's already up). Hosts are absolute in each
 * test: one run touches an org's domain and the admin.
 */
export default defineConfig({
  testDir: "./e2e",
  // One database: the walks seed their own org, but run one at a time.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    trace: "retain-on-failure",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  },
  projects: [
    // The visitor scans with a phone.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
