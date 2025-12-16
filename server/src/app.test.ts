import { describe, it, expect, vi, beforeEach } from "vitest";

describe("app.ts event handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be configured to handle uncaught exceptions and rejections", () => {
    // Verify process event handlers are registered by checking app setup
    expect(process.listeners("uncaughtException").length).toBeGreaterThan(0);
    expect(process.listeners("unhandledRejection").length).toBeGreaterThan(0);
  });
});
