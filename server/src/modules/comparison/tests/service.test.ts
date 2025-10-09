import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIProvider } from "@shared/config/index.js";
import { Result } from "@shared/utils/result.js";

vi.mock("../repository.js", () => ({
  createComparisonConversation: vi.fn(),
  insertComparisonPrompt: vi.fn(),
  insertComparisonOutput: vi.fn(),
  insertComparisonOutputStats: vi.fn(),
  updateUsageAggregates: vi.fn(),
}));
vi.mock("@server/lib/llm/streaming.js", () => ({ streamMultipleModels: vi.fn() }));
vi.mock("@server/lib/stream/helpers.js", () => ({ setupStreamHeaders: vi.fn(), sendStreamComplete: vi.fn() }));

import { createComparisonConversation, insertComparisonPrompt, insertComparisonOutput } from "../repository.js";
import { streamMultipleModels } from "@server/lib/llm/streaming.js";
import { createComparisonJobPayload, executeComparisonStream } from "../service.js";

describe("comparison service", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("createComparisonJobPayload", () => {
    const mockParams = {
      prompt: "Compare",
      models: [{ provider: AIProvider.OpenAI, modelId: "gpt-4", settings: {} }],
      useWebSearch: false,
    };

    it("creates conversation, uses existing, and handles errors", async () => {
      (createComparisonConversation as any).mockResolvedValue(Result.ok({ id: "conv-123" }));
      (insertComparisonPrompt as any).mockResolvedValue(Result.ok({ id: "prompt-456" }));

      let result = await createComparisonJobPayload("user-789", mockParams);
      expect(result.value.conversationId).toBe("conv-123");
      expect(result.value.promptId).toBe("prompt-456");

      result = await createComparisonJobPayload("user-123", { ...mockParams, conversationId: "existing-conv" });
      expect(result.value.conversationId).toBe("existing-conv");

      (createComparisonConversation as any).mockResolvedValue(
        Result.fail({ type: "DatabaseError", message: "Failed" }),
      );
      result = await createComparisonJobPayload("user-123", mockParams);
      expect(result.error.message).toBe("Failed to create comparison conversation");

      (createComparisonConversation as any).mockResolvedValue(Result.ok({ id: "conv-123" }));
      (insertComparisonPrompt as any).mockResolvedValue(
        Result.fail({ type: "DatabaseError", message: "Failed to insert prompt" }),
      );
      result = await createComparisonJobPayload("user-123", mockParams);
      expect(result.error.message).toBe("Failed to create comparison prompt");
    });
  });

  describe("executeComparisonStream", () => {
    const mockRes: any = { write: vi.fn(), end: vi.fn(), setHeader: vi.fn() };
    const mockParams = {
      conversationId: "conv-123",
      promptId: "prompt-456",
      prompt: "Compare",
      models: [{ provider: AIProvider.OpenAI, modelId: "gpt-4", settings: {} }],
      useWebSearch: false,
    };

    it("streams successfully and handles errors", async () => {
      (streamMultipleModels as any).mockResolvedValue([
        { status: "fulfilled", value: { success: true, usage: { totalTokens: 100 }, content: "Response 1" } },
      ]);
      (insertComparisonOutput as any).mockResolvedValue(Result.ok({ id: "output-1" }));

      let result = await executeComparisonStream(mockRes, mockParams, "user-123");
      expect(result.isSuccess).toBe(true);

      (streamMultipleModels as any).mockRejectedValue(new Error("Stream failed"));
      result = await executeComparisonStream(mockRes, mockParams, "user-123");
      expect(result.error.type).toBe("InternalServerError");
    });
  });
});
