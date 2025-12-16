import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables - NO REAL SUPABASE
dotenv.config({ path: path.join(__dirname, ".env.test") });

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    headless: true,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // webServer removed - ensure dev server is running separately with: npm run dev
  // Or for CI, add webServer back with proper cleanup

  globalSetup: path.join(__dirname, "./e2e/global-setup.ts"),
});
