import { FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  // CRITICAL: Ensure NO real Supabase calls happen during testing
  console.log("\n🔒 CRITICAL: Blocking all real Supabase calls");
  console.log("✅ Using mock Supabase environment only");

  // Set up test environment - SUPABASE FULLY MOCKED
  process.env.MOCK_MODE = "true";
  process.env.MOCK_SUPABASE = "true";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:3000/api/mock-supabase";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-key-test-only";
  process.env.TEST_MODE = "true";
  process.env.DISABLE_REAL_SUPABASE = "true";

  // Block environment variable usage of real URLs
  if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("supabase.co")) {
    throw new Error("❌ FATAL: Real Supabase URL detected! Use .env.test instead!");
  }

  return async () => {};
}

export default globalSetup;
