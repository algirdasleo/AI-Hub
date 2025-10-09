import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIProvider } from "@shared/config/index.js";
import { ErrorType } from "@shared/utils/index.js";

vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

vi.mock("../helpers.js", () => ({
  PROVIDER_CLIENTS: {
    [AIProvider.OpenAI]: vi.fn(),
    [AIProvider.Anthropic]: vi.fn(),
    [AIProvider.Google]: vi.fn(),
  },
  validateAPIKey: vi.fn(),
  createWebSearchTools: vi.fn(),
}));

describe("ai-manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("streamResponse", () => {
    it("should return error when API key validation fails", async () => {
      const { validateAPIKey } = await import("../helpers.js");
      (validateAPIKey as any).mockReturnValue({
        isSuccess: false,
        error: {
          type: ErrorType.ConfigurationError,
          message: "Missing API key for provider: openai",
        },
      });

      const { streamResponse } = await import("../ai-manager.js");
      const model = { provider: AIProvider.OpenAI, modelId: "gpt-4" };

      const result = await streamResponse(model);

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe(ErrorType.ConfigurationError);
      expect(result.error.message).toBe("Missing API key for provider: openai");
    });

    it("should stream successfully with valid inputs", async () => {
      const { validateAPIKey, createWebSearchTools, PROVIDER_CLIENTS } = await import("../helpers.js");
      const { streamText } = await import("ai");

      (validateAPIKey as any).mockReturnValue({ isSuccess: true, value: true });
      (createWebSearchTools as any).mockReturnValue(undefined);
      (PROVIDER_CLIENTS[AIProvider.OpenAI] as any).mockReturnValue("mocked-openai-model");
      (streamText as any).mockReturnValue({ fullStream: "mock-stream" });

      const { streamResponse } = await import("../ai-manager.js");
      const model = {
        provider: AIProvider.OpenAI,
        modelId: "gpt-4",
        settings: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      };
      const messages = [{ role: "user" as const, content: "Hello" }];

      const result = await streamResponse(model, "You are helpful", messages, false);

      expect(result.isSuccess).toBe(true);
      expect(result.value.fullStream).toBe("mock-stream");
      expect(validateAPIKey).toHaveBeenCalledWith(AIProvider.OpenAI);
      expect(createWebSearchTools).toHaveBeenCalledWith(AIProvider.OpenAI, false);
      expect(streamText).toHaveBeenCalledWith({
        model: "mocked-openai-model",
        system: "You are helpful",
        messages: messages,
        temperature: 0.7,
        maxOutputTokens: 1000,
        tools: undefined,
      });
    });

    it("should handle web search tools", async () => {
      const { validateAPIKey, createWebSearchTools, PROVIDER_CLIENTS } = await import("../helpers.js");
      const { streamText } = await import("ai");

      (validateAPIKey as any).mockReturnValue({ isSuccess: true, value: true });
      (createWebSearchTools as any).mockReturnValue({ webSearch: "mock-web-search-tool" });
      (PROVIDER_CLIENTS[AIProvider.Anthropic] as any).mockReturnValue("mocked-anthropic-model");
      (streamText as any).mockReturnValue({ fullStream: "mock-stream" });

      const { streamResponse } = await import("../ai-manager.js");
      const model = { provider: AIProvider.Anthropic, modelId: "claude-3" };

      const result = await streamResponse(model, undefined, [], true);

      expect(result.isSuccess).toBe(true);
      expect(createWebSearchTools).toHaveBeenCalledWith(AIProvider.Anthropic, true);
      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: { webSearch: "mock-web-search-tool" },
        }),
      );
    });

    it("should handle streamText errors", async () => {
      const { validateAPIKey, createWebSearchTools, PROVIDER_CLIENTS } = await import("../helpers.js");
      const { streamText } = await import("ai");

      (validateAPIKey as any).mockReturnValue({ isSuccess: true, value: true });
      (createWebSearchTools as any).mockReturnValue(undefined);
      (PROVIDER_CLIENTS[AIProvider.Google] as any).mockReturnValue("mocked-google-model");
      (streamText as any).mockImplementation(() => {
        throw new Error("Stream failed");
      });

      const { streamResponse } = await import("../ai-manager.js");
      const model = { provider: AIProvider.Google, modelId: "gemini-pro" };

      const result = await streamResponse(model);

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe(ErrorType.InternalServerError);
      expect(result.error.message).toBe("Failed to stream chat response");
      expect(result.error.details).toBeInstanceOf(Error);
    });

    it("should use default parameters", async () => {
      const { validateAPIKey, createWebSearchTools, PROVIDER_CLIENTS } = await import("../helpers.js");
      const { streamText } = await import("ai");

      (validateAPIKey as any).mockReturnValue({ isSuccess: true, value: true });
      (createWebSearchTools as any).mockReturnValue(undefined);
      (PROVIDER_CLIENTS[AIProvider.OpenAI] as any).mockReturnValue("mocked-openai-model");
      (streamText as any).mockReturnValue({ fullStream: "mock-stream" });

      const { streamResponse } = await import("../ai-manager.js");
      const model = { provider: AIProvider.OpenAI, modelId: "gpt-4" };

      const result = await streamResponse(model);

      expect(result.isSuccess).toBe(true);
      expect(createWebSearchTools).toHaveBeenCalledWith(AIProvider.OpenAI, false);
      expect(streamText).toHaveBeenCalledWith({
        model: "mocked-openai-model",
        system: undefined,
        messages: [],
        temperature: undefined,
        maxOutputTokens: undefined,
        tools: undefined,
      });
    });
  });
});
