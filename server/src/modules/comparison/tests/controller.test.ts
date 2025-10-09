import { describe, it, expect, vi, beforeEach } from "vitest";
import { Result } from "@shared/utils/result.js";

vi.stubEnv("REDIS_URL", "redis://localhost:6379");

vi.mock("@shared/types/comparison/comparison-request.js", () => ({
  ComparisonStreamSchema: {
    safeParse: vi.fn((d) => ({ success: true, data: d })),
    extend: vi.fn().mockReturnThis(),
  },
}));
vi.mock("../service.js", () => ({ createComparisonJobPayload: vi.fn(), executeComparisonStream: vi.fn() }));
vi.mock("../repository.js", () => ({
  getUserComparisonConversations: vi.fn(),
  getComparisonConversationPrompts: vi.fn(),
}));
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
}));

import { createComparisonJobPayload, executeComparisonStream } from "../service.js";
import { getUserComparisonConversations, getComparisonConversationPrompts } from "../repository.js";
import { createJob, getJob, deleteJob } from "@server/lib/job-store.js";
import {
  validateAuth,
  sendUnauthorized,
  sendInternalError,
  sendBadRequest,
  sendNotFound,
  getUidFromQuery,
} from "@server/utils/index.js";
import {
  createComparisonJob,
  getComparisonConversations,
  streamComparisonByUid,
  getComparisonMessages,
} from "../controller.js";
import { sendModelError } from "@server/lib/stream/helpers.js";

describe("comparison controller", () => {
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

  describe("createComparisonJob", () => {
    it("creates job and handles errors", async () => {
      const res = mockRes();
      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (createComparisonJobPayload as any).mockResolvedValue(
        Result.ok({ conversationId: "conv-123", promptId: "prompt-456" }),
      );
      (createJob as any).mockResolvedValue("job-uid");

      await createComparisonJob(
        {
          body: { prompt: "Compare", models: [{ provider: "OpenAI", modelId: "gpt-4", settings: {} }] },
          user: mockUser,
        } as any,
        res as any,
      );
      expect(res.json).toHaveBeenCalledWith({ uid: "job-uid" });

      (validateAuth as any).mockReturnValue({ isValid: false });
      await createComparisonJob({ user: mockUser } as any, mockRes() as any);
      expect(sendUnauthorized).toHaveBeenCalled();

      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (createComparisonJobPayload as any).mockResolvedValue(
        Result.fail({ type: "DatabaseError", message: "Failed" }),
      );
      await createComparisonJob(
        {
          body: { prompt: "Compare", models: [{ provider: "OpenAI", modelId: "gpt-4", settings: {} }] },
          user: mockUser,
        } as any,
        mockRes() as any,
      );
      expect(sendInternalError).toHaveBeenCalled();
    });
  });

  describe("streamComparisonByUid", () => {
    it("streams and handles errors", async () => {
      (getUidFromQuery as any).mockReturnValue("uid");
      (getJob as any).mockResolvedValue({
        prompt: "Compare",
        models: [{ provider: "OpenAI", modelId: "gpt-4", settings: {} }],
        conversationId: "conv",
        promptId: "prompt",
      });
      (executeComparisonStream as any).mockResolvedValue(Result.ok({}));

      await streamComparisonByUid({ user: mockUser } as any, mockRes() as any);
      expect(deleteJob).toHaveBeenCalledWith("uid");

      (getUidFromQuery as any).mockReturnValue(null);
      await streamComparisonByUid({ user: mockUser } as any, mockRes() as any);
      expect(sendBadRequest).toHaveBeenCalled();

      (getUidFromQuery as any).mockReturnValue("uid");
      (getJob as any).mockResolvedValue(undefined);
      await streamComparisonByUid({ user: mockUser } as any, mockRes() as any);
      expect(sendNotFound).toHaveBeenCalled();

      (getJob as any).mockResolvedValue({
        prompt: "Compare",
        models: [{ provider: "OpenAI", modelId: "gpt-4", settings: {} }],
        conversationId: "conv",
        promptId: "prompt",
      });
      await streamComparisonByUid({} as any, mockRes() as any);
      expect(sendUnauthorized).toHaveBeenCalled();

      (executeComparisonStream as any).mockResolvedValue(
        Result.fail({ type: "InternalServerError", message: "Failed" }),
      );
      await streamComparisonByUid({ user: mockUser } as any, mockRes() as any);
      expect(sendModelError).toHaveBeenCalled();
    });
  });

  describe("getComparisonConversations", () => {
    it("returns conversations and handles errors", async () => {
      const res = mockRes();
      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (getUserComparisonConversations as any).mockResolvedValue(Result.ok([{ id: "conv-1" }]));

      await getComparisonConversations({ user: mockUser } as any, res as any);
      expect(res.json).toHaveBeenCalledWith([{ id: "conv-1" }]);

      (getUserComparisonConversations as any).mockRejectedValue(new Error("Fail"));
      await getComparisonConversations({ user: mockUser } as any, mockRes() as any);
      expect(sendInternalError).toHaveBeenCalled();
    });
  });

  describe("getComparisonMessages", () => {
    it("returns messages and handles errors", async () => {
      const res = mockRes();
      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      (getComparisonConversationPrompts as any).mockResolvedValue(Result.ok([{ id: "prompt-1" }]));

      await getComparisonMessages({ user: mockUser, params: { conversationId: "conv-123" } } as any, res as any);
      expect(res.json).toHaveBeenCalledWith([{ id: "prompt-1" }]);

      (validateAuth as any).mockReturnValue({ isValid: false });
      await getComparisonMessages(
        { user: mockUser, params: { conversationId: "conv-123" } } as any,
        mockRes() as any,
      );
      expect(sendUnauthorized).toHaveBeenCalled();

      (validateAuth as any).mockReturnValue({ isValid: true, userId: "user-123" });
      await getComparisonMessages({ user: mockUser, params: {} } as any, mockRes() as any);
      expect(sendBadRequest).toHaveBeenCalled();

      (getComparisonConversationPrompts as any).mockResolvedValue(
        Result.fail({ type: "NotFound", message: "Not found" }),
      );
      await getComparisonMessages(
        { user: mockUser, params: { conversationId: "conv-123" } } as any,
        mockRes() as any,
      );
      expect(sendNotFound).toHaveBeenCalled();

      (getComparisonConversationPrompts as any).mockResolvedValue(
        Result.fail({ type: "DatabaseError", message: "DB error" }),
      );
      await getComparisonMessages(
        { user: mockUser, params: { conversationId: "conv-123" } } as any,
        mockRes() as any,
      );
      expect(sendInternalError).toHaveBeenCalled();
    });
  });
});
