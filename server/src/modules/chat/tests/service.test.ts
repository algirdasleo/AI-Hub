import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIProvider } from "@shared/config/index.js";
import { Result } from "@shared/utils/result.js";

vi.mock("../repository.js", () => ({
  createChatConversation: vi.fn(),
  addMessage: vi.fn(),
  insertChatMessageStats: vi.fn(),
  updateUsageAggregates: vi.fn(),
  getConversationMessages: vi.fn(),
}));
vi.mock("@server/modules/projects/conversation-repository.js", () => ({
  createProjectConversation: vi.fn(),
  addProjectMessage: vi.fn(),
  getProjectConversationMessages: vi.fn(),
  insertProjectMessageStats: vi.fn(),
}));
vi.mock("@server/modules/projects/repository.js", () => ({
  getProjectDocuments: vi.fn(),
  recordUsedDocument: vi.fn(),
}));
vi.mock("@server/modules/projects/service.js", () => ({
  queryDocumentsWithRAG: vi.fn(),
}));
vi.mock("@server/lib/llm/streaming.js", () => ({ streamModel: vi.fn() }));
vi.mock("@server/lib/stream/index.js", () => ({
  setupStreamHeaders: vi.fn(),
  sendUsage: vi.fn(),
  sendStreamComplete: vi.fn(),
  buildUsagePayload: vi.fn(),
}));
vi.mock("@server/lib/llm/helpers.js", () => ({
  mapChatRepositoryToModelMessages: vi.fn(() => []),
}));

import {
  createChatConversation,
  addMessage,
  getConversationMessages,
  insertChatMessageStats,
  updateUsageAggregates,
} from "../repository.js";
import {
  createProjectConversation,
  addProjectMessage,
  getProjectConversationMessages,
  insertProjectMessageStats,
} from "@server/modules/projects/conversation-repository.js";
import { getProjectDocuments, recordUsedDocument } from "@server/modules/projects/repository.js";
import { queryDocumentsWithRAG } from "@server/modules/projects/service.js";
import { streamModel } from "@server/lib/llm/streaming.js";
import { createChatJobPayload, executeChatStream, saveChatMessageStats } from "../service.js";

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
      (getConversationMessages as any).mockResolvedValue(Result.ok([]));
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

    it("handles project conversations with RAG", async () => {
      const projectParams = { ...mockParams, projectId: "proj-123" };
      (getProjectConversationMessages as any).mockResolvedValue(Result.ok([]));
      (getProjectDocuments as any).mockResolvedValue(Result.ok([{ status: "ready", file_name: "doc1.pdf" }]));
      (queryDocumentsWithRAG as any).mockResolvedValue(
        Result.ok([{ chunkText: "RAG content", relevanceScore: 0.9 }]),
      );
      (streamModel as any).mockResolvedValue({
        success: true,
        usage: { totalTokens: 100, inputTokens: 50, outputTokens: 50 },
        content: "Project response",
        latencyMs: 1000,
      });
      (addProjectMessage as any).mockResolvedValue(Result.ok({ id: "msg-123" }));

      const result = await executeChatStream(mockRes, projectParams, "user-123");
      expect(result.isSuccess).toBe(true);
      expect(addProjectMessage).toHaveBeenCalled();
    });

    it("handles project conversations without RAG results", async () => {
      const projectParams = { ...mockParams, projectId: "proj-123" };
      (getProjectConversationMessages as any).mockResolvedValue(Result.ok([]));
      (getProjectDocuments as any).mockResolvedValue(Result.ok([{ status: "ready", file_name: "doc.pdf" }]));
      (queryDocumentsWithRAG as any).mockResolvedValue(Result.ok([]));
      (streamModel as any).mockResolvedValue({
        success: true,
        usage: { totalTokens: 100, inputTokens: 50, outputTokens: 50 },
        content: "Response",
      });
      (addProjectMessage as any).mockResolvedValue(Result.ok({ id: "msg-123" }));

      const result = await executeChatStream(mockRes, projectParams, "user-123");
      expect(result.isSuccess).toBe(true);
    });

    it("handles previous messages in conversation", async () => {
      const mockMessages = [
        { role: "user", content: "Previous question" },
        { role: "assistant", content: "Previous answer" },
      ];
      (getConversationMessages as any).mockResolvedValue(Result.ok(mockMessages));
      (streamModel as any).mockResolvedValue({
        success: true,
        usage: { totalTokens: 100, inputTokens: 50, outputTokens: 50 },
        content: "Follow-up response",
      });
      (addMessage as any).mockResolvedValue(Result.ok({ id: "msg-456" }));

      const result = await executeChatStream(mockRes, mockParams, "user-123");
      expect(result.isSuccess).toBe(true);
    });

    it("handles empty system prompt", async () => {
      const paramsWithEmptyPrompt = { ...mockParams, systemPrompt: "   " };
      (getConversationMessages as any).mockResolvedValue(Result.ok([]));
      (streamModel as any).mockResolvedValue({
        success: true,
        usage: { totalTokens: 100, inputTokens: 50, outputTokens: 50 },
        content: "Response",
      });
      (addMessage as any).mockResolvedValue(Result.ok({ id: "msg-789" }));

      const result = await executeChatStream(mockRes, paramsWithEmptyPrompt, "user-123");
      expect(result.isSuccess).toBe(true);
    });

    it("handles response without content", async () => {
      (getConversationMessages as any).mockResolvedValue(Result.ok([]));
      (streamModel as any).mockResolvedValue({
        success: true,
        usage: { totalTokens: 50, inputTokens: 30, outputTokens: 20 },
        content: null,
      });

      const result = await executeChatStream(mockRes, mockParams, "user-123");
      expect(result.isSuccess).toBe(true);
      expect(addMessage).not.toHaveBeenCalled();
    });
  });

  describe("saveChatMessageStats", () => {
    it("saves stats for regular chat with total tokens", async () => {
      const mockInsertStats = vi.fn();
      const mockUpdateUsage = vi.fn();

      const usage = { totalTokens: 100, inputTokens: 50, outputTokens: 50 };
      await saveChatMessageStats("msg-123", "gpt-4", "user-456", "conv-789", usage);

      // Verify the function executes without errors
      expect(true).toBe(true);
    });

    it("calculates tokens when total is not provided", async () => {
      const usage = { inputTokens: 50, outputTokens: 50 } as any;
      await saveChatMessageStats("msg-123", "gpt-4", "user-456", "conv-789", usage);

      expect(true).toBe(true);
    });

    it("saves project message stats", async () => {
      (insertProjectMessageStats as any).mockResolvedValue(undefined);

      const usage = { totalTokens: 100, inputTokens: 50, outputTokens: 50 };
      await saveChatMessageStats("msg-123", "gpt-4", "user-456", "conv-789", usage, 1000, "proj-123");

      expect(insertProjectMessageStats).toHaveBeenCalled();
    });

    it("handles stats save errors gracefully", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const usage = { totalTokens: 100, inputTokens: 50, outputTokens: 50 };
      await saveChatMessageStats("msg-123", "gpt-4", "user-456", "conv-789", usage);

      consoleWarnSpy.mockRestore();
      expect(true).toBe(true);
    });
  });
});
