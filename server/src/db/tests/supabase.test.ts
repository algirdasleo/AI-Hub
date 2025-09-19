import { describe, it, expect, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue("mock-supabase-client"),
}));

describe("supabase", () => {
  it("should create client with valid env vars", async () => {
    vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "test-secret-key");

    const { createClient } = await import("@supabase/supabase-js");
    await import("../supabase.js");

    expect(createClient).toHaveBeenCalledWith("https://test.supabase.co", "test-secret-key");
  });

  it("should throw when env vars missing", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(async () => {
      vi.resetModules();
      await import("../supabase.js");
    }).rejects.toThrow("Supabase environment variables are not set");

    expect(consoleError).toHaveBeenCalledWith("[startup] Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
    consoleError.mockRestore();
  });
});
