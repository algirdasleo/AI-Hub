import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIProvider } from "@shared/config/index.js";
import { ErrorType } from "@shared/utils/index.js";

vi.mock("@ai-sdk/openai", () => ({
  openai: { tools: { webSearch: vi.fn(() => "openai-tool") } },
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: { tools: { webSearch_20250305: vi.fn(() => "anthropic-tool") } },
}));

vi.mock("@ai-sdk/google", () => ({
  google: { tools: { googleSearch: vi.fn(() => "google-tool") } },
}));

import { makeMockRes, expectSSEEvent } from "../../../tests/testUtils.js";

describe("helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("validateAPIKey", () => {
    it("should return success with valid key", async () => {
      vi.stubEnv("OPENAI_API_KEY", "test-key");
      const { validateAPIKey } = await import("../helpers.js");

      expect(validateAPIKey(AIProvider.OpenAI).isSuccess).toBe(true);
    });

    it("should return error when key missing", async () => {
      vi.stubEnv("OPENAI_API_KEY", "");
      const { validateAPIKey } = await import("../helpers.js");
      const result = validateAPIKey(AIProvider.OpenAI);

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe(ErrorType.ConfigurationError);
      expect(result.error.message).toBe("Missing API key for provider: OpenAI");
    });

    it("should validate all providers", async () => {
      vi.stubEnv("OPENAI_API_KEY", "");
      vi.stubEnv("ANTHROPIC_API_KEY", "");
      vi.stubEnv("GOOGLE_API_KEY", "");
      const { validateAPIKey } = await import("../helpers.js");

      expect(validateAPIKey(AIProvider.OpenAI).isSuccess).toBe(false);
      expect(validateAPIKey(AIProvider.Anthropic).isSuccess).toBe(false);
      expect(validateAPIKey(AIProvider.Google).isSuccess).toBe(false);
    });
  });

  describe("getWebSearchTool", () => {
    it("should return tool for each provider", async () => {
      const { getWebSearchTool } = await import("../helpers.js");

      expect(getWebSearchTool(AIProvider.OpenAI)).toBeDefined();
      expect(getWebSearchTool(AIProvider.Anthropic)).toBeDefined();
      expect(getWebSearchTool(AIProvider.Google)).toBeDefined();
    });

    it("should return null for unknown provider", async () => {
      const { getWebSearchTool } = await import("../helpers.js");

      expect(getWebSearchTool("unknown" as AIProvider)).toBeNull();
    });
  });

  describe("createWebSearchTools", () => {
    it("should return undefined when disabled", async () => {
      const { createWebSearchTools } = await import("../helpers.js");

      expect(createWebSearchTools(AIProvider.OpenAI, false)).toBeUndefined();
    });

    it("should return undefined for unknown provider", async () => {
      const { createWebSearchTools } = await import("../helpers.js");

      expect(createWebSearchTools("UnknownProvider" as AIProvider, true)).toBeUndefined();
    });

    it("should return tools for valid providers", async () => {
      const { createWebSearchTools } = await import("../helpers.js");

      expect(createWebSearchTools(AIProvider.OpenAI, true)).toEqual({
        web_search: "openai-tool",
      });
      expect(createWebSearchTools(AIProvider.Anthropic, true)).toEqual({
        web_search: "anthropic-tool",
      });
      expect(createWebSearchTools(AIProvider.Google, true)).toEqual({
        web_search: "google-tool",
      });
    });

    it("handleStreamPart handles error type", async () => {
      const { handleStreamPart } = await import("../helpers.js");
      const mockRes = makeMockRes();
      const result = handleStreamPart(
        mockRes as any,
        { type: "error", error: new Error("API Error") } as any,
        false,
        Date.now(),
        "gpt-4",
      );
      expect(result.shouldContinue).toBe(false);
      expect(result.firstTokenSent).toBe(false);
    });

    it("handleStreamPart handles tool-error type", async () => {
      const { handleStreamPart } = await import("../helpers.js");
      const mockRes = makeMockRes();
      const result = handleStreamPart(
        mockRes as any,
        {
          type: "tool-error",
          error: new Error("Tool failed"),
          toolCallId: "123",
          toolName: "test",
          input: {},
        } as any,
        false,
        Date.now(),
        "gpt-4",
      );
      expect(result.shouldContinue).toBe(false);
      expect(result.firstTokenSent).toBe(false);
    });
  });
});
