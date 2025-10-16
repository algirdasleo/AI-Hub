import { describe, it, expect, vi, beforeEach } from "vitest";
import { ErrorType } from "@shared/utils/error-type.js";
import { MessageRole } from "@shared/types/chat/index.js";

vi.mock("@server/db/supabase.js", () => ({ supabaseServer: { from: vi.fn(), rpc: vi.fn() } }));

import { supabaseServer } from "@server/db/supabase.js";
import {
  createChatConversation,
  addMessage,
  insertChatMessageStats,
  getUserConversations,
  getConversationMessages,
  updateMessageContent,
  updateUsageAggregates,
} from "../repository.js";

describe("chat repository", () => {
  const mockChain = (data: any, error: any = null) => ({ select: vi.fn().mockResolvedValue({ data, error }) });

  beforeEach(() => vi.clearAllMocks());

  it("createChatConversation handles success and errors", async () => {
    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain([{ id: "conv-123" }])),
    });
    let result = await createChatConversation("user-123", "Test");
    expect(result.value).toEqual({ id: "conv-123" });

    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain(null, { message: "DB error" })),
    });
    result = await createChatConversation("user-123");
    expect(result.error.type).toBe(ErrorType.DatabaseError);

    (supabaseServer.from as any).mockReturnValue({ insert: vi.fn().mockReturnValue(mockChain([])) });
    result = await createChatConversation("user-123");
    expect(result.isSuccess).toBe(false);
  });

  it("addMessage handles success and errors", async () => {
    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain([{ id: "msg-123" }])),
    });
    let result = await addMessage("conv-123", MessageRole.USER, "Hello");
    expect(result.value).toEqual({ id: "msg-123" });

    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain(null, { message: "DB error" })),
    });
    result = await addMessage("conv-123", MessageRole.USER, "Hello");
    expect(result.isSuccess).toBe(false);

    (supabaseServer.from as any).mockReturnValue({ insert: vi.fn().mockReturnValue(mockChain([])) });
    result = await addMessage("conv-123", MessageRole.USER, "Hello");
    expect(result.isSuccess).toBe(false);
    expect(result.error.message).toBe("No message data returned");
  });

  it("insertChatMessageStats handles success and errors", async () => {
    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain([{ id: "stat-123" }])),
    });
    let result = await insertChatMessageStats("msg-123", 100, 0.01, 500);
    expect(result.isSuccess).toBe(true);

    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain(null, { message: "DB error" })),
    });
    result = await insertChatMessageStats("msg-123", 100, 0.01);
    expect(result.isSuccess).toBe(false);

    (supabaseServer.from as any).mockReturnValue({ insert: vi.fn().mockReturnValue(mockChain([])) });
    result = await insertChatMessageStats("msg-123", 100, 0.01);
    expect(result.isSuccess).toBe(false);
    expect(result.error.message).toBe("No chat message stats data returned");
  });

  it("updateMessageContent handles success and errors", async () => {
    (supabaseServer.from as any).mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    });
    let result = await updateMessageContent("msg-123", "Updated");
    expect(result.isSuccess).toBe(true);

    (supabaseServer.from as any).mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }) }),
    });
    result = await updateMessageContent("msg-123", "Updated");
    expect(result.isSuccess).toBe(false);
  });

  it("updateUsageAggregates handles success and errors", async () => {
    (supabaseServer.rpc as any).mockResolvedValue({ error: null });
    let result = await updateUsageAggregates("gpt-4", "user-1", "conv-1", 100, 0.01);
    expect(result.isSuccess).toBe(true);

    (supabaseServer.rpc as any).mockRejectedValue(new Error("RPC failed"));
    result = await updateUsageAggregates("gpt-4", "user-1", "conv-1", 100, 0.01);
    expect(result.isSuccess).toBe(false);
  });

  it("getUserConversations handles success and errors", async () => {
    const mockOrderChain = vi.fn().mockResolvedValue({ data: [{ id: "conv-1" }], error: null });
    (supabaseServer.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: mockOrderChain }) }),
    });
    let result = await getUserConversations("user-123");
    expect(result.value).toHaveLength(1);

    mockOrderChain.mockResolvedValue({ data: null, error: { message: "DB error" } });
    result = await getUserConversations("user-123");
    expect(result.isSuccess).toBe(false);
  });

  it("getConversationMessages handles success and errors", async () => {
    const mockConvChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi
            .fn()
            .mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: "conv-123" }, error: null }) }),
        }),
      }),
    };
    const mockMsgChain = {
      select: vi.fn().mockReturnValue({
        eq: vi
          .fn()
          .mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [{ id: "msg-1" }], error: null }) }),
      }),
    };
    (supabaseServer.from as any).mockReturnValueOnce(mockConvChain).mockReturnValueOnce(mockMsgChain);

    let result = await getConversationMessages("conv-123", "user-123");
    expect(result.value).toHaveLength(1);

    const mockConvErrorChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
          }),
        }),
      }),
    };
    (supabaseServer.from as any).mockReturnValueOnce(mockConvErrorChain);
    result = await getConversationMessages("conv-123", "user-123");
    expect(result.error.type).toBe(ErrorType.NotFound);

    const mockConvExceptionChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "conv-123" }, error: null }),
          }),
        }),
      }),
    };
    const mockMsgExceptionChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error("Database exception")),
        }),
      }),
    };
    (supabaseServer.from as any)
      .mockReturnValueOnce(mockConvExceptionChain)
      .mockReturnValueOnce(mockMsgExceptionChain);
    result = await getConversationMessages("conv-123", "user-123");
    expect(result.isSuccess).toBe(false);
    expect(result.error.type).toBe(ErrorType.DatabaseError);
    expect(result.error.message).toBe("Error fetching conversation messages");
  });
});
