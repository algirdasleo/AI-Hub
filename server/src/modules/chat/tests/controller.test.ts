import { describe, it, expect, vi, beforeEach } from "vitest";
import { Result } from "@shared/utils/result.js";
import { AuthRequest } from "@server/modules/auth/index.js";

vi.stubEnv("REDIS_URL", "redis://localhost:6379");

vi.mock("@shared/types/chat/index.js", () => ({
  ChatStreamSchema: {
    safeParse: vi.fn((d: any) => ({ success: true, data: d })),
    extend: vi.fn().mockReturnThis(),
  },
}));
vi.mock("../service.js", () => ({ createChatJobPayload: vi.fn(), executeChatStream: vi.fn() }));
vi.mock("../repository.js", () => ({ getUserConversations: vi.fn(), getConversationMessages: vi.fn() }));
vi.mock("@server/lib/job-store.js", () => ({ createJob: vi.fn(), getJob: vi.fn(), deleteJob: vi.fn() }));
vi.mock("@server/utils/index.js", () => ({
  validateAuth: vi.fn(),
  sendUnauthorized: vi.fn(),
  sendBadRequest: vi.fn(),
  sendInternalError: vi.fn(),
  sendNotFound: vi.fn(),
  getUidFromQuery: vi.fn(),
}));
vi.mock("@server/lib/stream/helpers.js", () => ({
  sendModelError: vi.fn(),
  setupStreamHeaders: vi.fn(),
  sendStreamComplete: vi.fn(),
  sendModelText: vi.fn(),
  sendLatencyMs: vi.fn(),
}));

import { createChatJobPayload, executeChatStream } from "../service.js";
import { getUserConversations, getConversationMessages } from "../repository.js";
import { createJob, getJob, deleteJob } from "@server/lib/job-store.js";
import { ChatStreamSchema } from "@shared/types/chat/index.js";
import {
  validateAuth,
  sendUnauthorized,
  sendInternalError,
  sendBadRequest,
  sendNotFound,
  getUidFromQuery,
} from "@server/utils/index.js";
import { createChatJob, streamChatByUid, getConversations, getMessages } from "../controller.js";
import { sendModelError } from "@server/lib/stream/helpers.js";

describe("chat controller", () => {
  const mockRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
  });
  const mockUser = {
    id: "user-123",
    email: "test@test.com",
    role: "user" as any,
    display_name: "Test",
    subscription_tier: "free" as any,
  };

  beforeEach(() => vi.clearAllMocks());

  describe("createChatJob", () => {
    it("creates job and handles errors", async () => {
      const res = mockRes();
      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (createChatJobPayload as any).mockResolvedValue(Result.ok({ conversationId: "conv-123" }));
      (createJob as any).mockResolvedValue("job-uid");

      await createChatJob(
        { body: { prompt: "Hi", provider: "OpenAI", modelId: "gpt-4" }, user: mockUser } as any,
        res as any,
      );
      expect(res.json).toHaveBeenCalledWith({ uid: "job-uid", conversationId: "conv-123" });

      (validateAuth as any).mockReturnValue({ isValid: false });
      await createChatJob({ user: mockUser } as any, mockRes() as any);
      expect(sendUnauthorized).toHaveBeenCalled();

      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (createChatJobPayload as any).mockResolvedValue(Result.fail({ type: "DatabaseError", message: "Fail" }));
      await createChatJob(
        { body: { prompt: "Hi", provider: "OpenAI", modelId: "gpt-4" }, user: mockUser } as any,
        mockRes() as any,
      );
      expect(sendInternalError).toHaveBeenCalled();
    });
  });

  describe("streamChatByUid", () => {
    it("streams and handles errors", async () => {
      (getUidFromQuery as any).mockReturnValue("uid");
      (getJob as any).mockResolvedValue({
        prompt: "Hi",
        provider: "OpenAI",
        modelId: "gpt-4",
        conversationId: "conv",
      });
      (executeChatStream as any).mockResolvedValue(Result.ok({}));

      await streamChatByUid({ user: mockUser } as any, mockRes() as any);
      expect(deleteJob).toHaveBeenCalledWith("uid");

      (getUidFromQuery as any).mockReturnValue(null);
      await streamChatByUid({ user: mockUser } as any, mockRes() as any);
      expect(sendBadRequest).toHaveBeenCalled();

      (getUidFromQuery as any).mockReturnValue("uid");
      (getJob as any).mockResolvedValue(undefined);
      await streamChatByUid({ user: mockUser } as any, mockRes() as any);
      expect(sendNotFound).toHaveBeenCalled();

      (getJob as any).mockResolvedValue({
        prompt: "Hi",
        provider: "OpenAI",
        modelId: "gpt-4",
        conversationId: "conv",
      });
      await streamChatByUid({} as any, mockRes() as any);
      expect(sendUnauthorized).toHaveBeenCalled();

      (getJob as any).mockResolvedValue({
        prompt: "Hi",
        provider: "OpenAI",
        modelId: "gpt-4",
        conversationId: "conv",
      });
      (executeChatStream as any).mockResolvedValue(Result.fail({ type: "InternalServerError", message: "Fail" }));
      await streamChatByUid({ user: mockUser } as any, mockRes() as any);
      expect(sendModelError).toHaveBeenCalled();
    });
  });

  describe("getConversations", () => {
    it("returns conversations and handles errors", async () => {
      const res = mockRes();
      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (getUserConversations as any).mockResolvedValue(Result.ok([{ id: "conv-1" }]));

      await getConversations({ user: mockUser } as any, res as any);
      expect(res.json).toHaveBeenCalledWith([{ id: "conv-1" }]);

      (getUserConversations as any).mockRejectedValue(new Error("Fail"));
      await getConversations({ user: mockUser } as any, mockRes() as any);
      expect(sendInternalError).toHaveBeenCalled();
    });
  });

  describe("getMessages", () => {
    it("returns messages and handles errors", async () => {
      const res = mockRes();
      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (getConversationMessages as any).mockResolvedValue(Result.ok([{ id: "msg-1" }]));

      await getMessages({ user: mockUser, params: { conversationId: "conv-123" } } as any, res as any);
      expect(res.json).toHaveBeenCalledWith([{ id: "msg-1" }]);

      (validateAuth as any).mockReturnValue({ isValid: false });
      await getMessages({ user: mockUser, params: { conversationId: "conv-123" } } as any, mockRes() as any);
      expect(sendUnauthorized).toHaveBeenCalled();

      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      await getMessages({ user: mockUser, params: {} } as any, mockRes() as any);
      expect(sendBadRequest).toHaveBeenCalled();

      (getConversationMessages as any).mockResolvedValue(Result.fail({ type: "NotFound", message: "Not found" }));
      await getMessages({ user: mockUser, params: { conversationId: "conv-123" } } as any, mockRes() as any);
      expect(sendNotFound).toHaveBeenCalled();

      (getConversationMessages as any).mockResolvedValue(
        Result.fail({ type: "DatabaseError", message: "DB error" }),
      );
      await getMessages({ user: mockUser, params: { conversationId: "conv-123" } } as any, mockRes() as any);
      expect(sendInternalError).toHaveBeenCalled();
    });

    it("handles getMessages exception", async () => {
      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (getConversationMessages as any).mockRejectedValue(new Error("Unexpected error"));
      await getMessages({ user: mockUser, params: { conversationId: "conv-123" } } as any, mockRes() as any);
      expect(sendInternalError).toHaveBeenCalled();
    });
  });

  describe("getConversations edge cases", () => {
    it("handles getConversations exception", async () => {
      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (getUserConversations as any).mockRejectedValue(new Error("Unexpected error"));
      await getConversations({ user: mockUser } as any, mockRes() as any);
      expect(sendInternalError).toHaveBeenCalled();
    });

    it("handles getUserConversations failure result", async () => {
      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (getUserConversations as any).mockResolvedValue(Result.fail({ type: "DatabaseError", message: "DB error" }));
      await getConversations({ user: mockUser } as any, mockRes() as any);
      expect(sendInternalError).toHaveBeenCalledWith(expect.anything(), "DB error");
    });
  });

  describe("createChatJob edge cases", () => {
    it("handles createChatJob exception", async () => {
      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (createChatJobPayload as any).mockRejectedValue(new Error("Unexpected error"));
      await createChatJob(
        { body: { prompt: "Hi", provider: "OpenAI", modelId: "gpt-4" }, user: mockUser } as any,
        mockRes() as any,
      );
      expect(sendInternalError).toHaveBeenCalled();
    });

    it("handles invalid chat request payload", async () => {
      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (ChatStreamSchema.safeParse as any).mockReturnValueOnce({
        success: false,
        error: { issues: [] },
      });
      await createChatJob({ body: { invalid: "data" }, user: mockUser } as any, mockRes() as any);
      expect(sendBadRequest).toHaveBeenCalledWith(expect.anything(), "Invalid chat request payload");
    });
  });

  describe("streamChatByUid edge cases", () => {
    it("handles deleteJob failure", async () => {
      (getUidFromQuery as any).mockReturnValue("uid");
      (getJob as any).mockResolvedValue({
        prompt: "Hi",
        provider: "OpenAI",
        modelId: "gpt-4",
        conversationId: "conv",
      });
      (executeChatStream as any).mockResolvedValue(Result.ok({}));
      (deleteJob as any).mockRejectedValue(new Error("Delete failed"));

      await streamChatByUid({ user: mockUser } as any, mockRes() as any);
      expect(deleteJob).toHaveBeenCalledWith("uid");
    });
  });
});
