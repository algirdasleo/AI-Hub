import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIProvider } from "@shared/config/index.js";
import { Result } from "@shared/utils/result.js";

vi.mock("../repository.js", () => ({
  createChatConversation: vi.fn(),
  addMessage: vi.fn(),
  insertChatMessageStats: vi.fn(),
  updateUsageAggregates: vi.fn(),
}));
vi.mock("@server/lib/llm/streaming.js", () => ({ streamModel: vi.fn() }));
vi.mock("@server/lib/stream/index.js", () => ({
  setupStreamHeaders: vi.fn(),
  sendUsage: vi.fn(),
  sendStreamComplete: vi.fn(),
  buildUsagePayload: vi.fn(),
}));

import { createChatConversation, addMessage } from "../repository.js";
import { streamModel } from "@server/lib/llm/streaming.js";
import { createChatJobPayload, executeChatStream } from "../service.js";

describe("chat service", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("createChatJobPayload", () => {
    const mockParams = {
      prompt: "Hi",
      provider: AIProvider.OpenAI,
      modelId: "gpt-4",
      settings: {},
      useWebSearch: false,
    };

    it("creates conversation, uses existing, and handles errors", async () => {
      (createChatConversation as any).mockResolvedValue(Result.ok({ id: "conv-123" }));
      (addMessage as any).mockResolvedValue(Result.ok({ id: "msg-123" }));

      let result = await createChatJobPayload("user-456", mockParams);
      expect(result.isSuccess).toBe(true);
      expect(result.value.conversationId).toBe("conv-123");

      result = await createChatJobPayload("user-789", { ...mockParams, conversationId: "existing-conv" });
      expect(result.value.conversationId).toBe("existing-conv");
      expect(createChatConversation).toHaveBeenCalledTimes(1);

      (createChatConversation as any).mockResolvedValue(
        Result.fail({ type: "DatabaseError", message: "Failed to create" }),
      );
      result = await createChatJobPayload("user-123", mockParams);
      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe("Failed to create chat conversation");

      (createChatConversation as any).mockResolvedValue(Result.ok({ id: "conv-123" }));
      (addMessage as any).mockResolvedValue(Result.fail({ type: "DatabaseError", message: "Failed to save" }));
      result = await createChatJobPayload("user-123", mockParams);
      expect(result.error.message).toBe("Failed to save user message");

      (createChatConversation as any).mockRejectedValue(new Error("Unexpected database error"));
      result = await createChatJobPayload("user-123", mockParams);
      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe("InternalServerError");
    });
  });

  describe("executeChatStream", () => {
    const mockRes: any = { write: vi.fn(), end: vi.fn(), setHeader: vi.fn() };
    const mockParams = {
      conversationId: "conv-123",
      prompt: "Hi",
      provider: AIProvider.OpenAI,
      modelId: "gpt-4",
      settings: {},
      useWebSearch: false,
    };

    it("streams successfully and handles errors", async () => {
      (streamModel as any).mockResolvedValue({
        success: true,
        usage: { totalTokens: 100, inputTokens: 50, outputTokens: 50 },
        content: "Hello!",
        latencyMs: 1000,
      });
      (addMessage as any).mockResolvedValue(Result.ok({ id: "msg-response" }));

      let result = await executeChatStream(mockRes, mockParams, "user-123");
      expect(result.isSuccess).toBe(true);

      (streamModel as any).mockResolvedValue({ success: false });
      result = await executeChatStream(mockRes, mockParams, "user-123");
      expect(result.error.type).toBe("StreamError");

      (streamModel as any).mockResolvedValue({ success: true, usage: null, content: "Response" });
      result = await executeChatStream(mockRes, mockParams, "user-123");
      expect(result.error.message).toBe("No usage data");

      (streamModel as any).mockResolvedValue({
        success: true,
        usage: { totalTokens: 100, inputTokens: 50, outputTokens: 50 },
        content: "Response",
      });
      (addMessage as any).mockResolvedValue(Result.fail({ type: "DatabaseError", message: "Save failed" }));
      result = await executeChatStream(mockRes, mockParams, "user-123");
      expect(result.isSuccess).toBe(false);

      (streamModel as any).mockRejectedValue(new Error("Stream crashed"));
      result = await executeChatStream(mockRes, mockParams, "user-123");
      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe("InternalServerError");
    });
  });
});
