import { describe, it, expect, vi, beforeEach } from "vitest";
import { ErrorType } from "@shared/utils/error-type.js";

vi.mock("@server/db/supabase.js", () => ({ supabaseServer: { from: vi.fn(), rpc: vi.fn() } }));

import { supabaseServer } from "@server/db/supabase.js";
import {
  createComparisonConversation,
  insertComparisonPrompt,
  insertComparisonOutput,
  insertComparisonOutputStats,
  updateUsageAggregates,
  getUserComparisonConversations,
  getComparisonConversationPrompts,
} from "../repository.js";

describe("Comparison Repository", () => {
  const mockChain = (data: any, error: any = null) => ({ select: vi.fn().mockResolvedValue({ data, error }) });

  beforeEach(() => vi.clearAllMocks());

  it("insertComparisonPrompt handles success and errors", async () => {
    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain([{ id: "prompt-123" }])),
    });
    let result = await insertComparisonPrompt("conv-123", "Test prompt");
    expect(result.value).toEqual({ id: "prompt-123" });

    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain(null, { message: "DB error" })),
    });
    result = await insertComparisonPrompt("conv-123", "Test");
    expect(result.error.type).toBe(ErrorType.DatabaseError);

    (supabaseServer.from as any).mockReturnValue({ insert: vi.fn().mockReturnValue(mockChain([])) });
    result = await insertComparisonPrompt("conv-123", "Test");
    expect(result.isSuccess).toBe(false);
  });

  it("createComparisonConversation handles success and errors", async () => {
    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain([{ id: "conv-123" }])),
    });
    let result = await createComparisonConversation("user-123");
    expect(result.isSuccess).toBe(true);

    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain(null, { message: "DB error" })),
    });
    result = await createComparisonConversation("user-123");
    expect(result.isSuccess).toBe(false);

    (supabaseServer.from as any).mockReturnValue({ insert: vi.fn().mockReturnValue(mockChain([])) });
    result = await createComparisonConversation("user-123");
    expect(result.isSuccess).toBe(false);
  });

  it("insertComparisonOutput handles success and errors", async () => {
    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain([{ id: "output-123" }])),
    });
    let result = await insertComparisonOutput("prompt-123", "gpt-4", "assistant", "Response");
    expect(result.isSuccess).toBe(true);

    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain(null, { message: "DB error" })),
    });
    result = await insertComparisonOutput("prompt-123", "gpt-4", "assistant", "Response");
    expect(result.isSuccess).toBe(false);

    (supabaseServer.from as any).mockReturnValue({ insert: vi.fn().mockReturnValue(mockChain([])) });
    result = await insertComparisonOutput("prompt-123", "gpt-4", "assistant", "Response");
    expect(result.isSuccess).toBe(false);
  });

  it("insertComparisonOutputStats handles success and errors", async () => {
    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain([{ id: "stat-123" }])),
    });
    let result = await insertComparisonOutputStats("output-123", 100, 0.01, 500);
    expect(result.isSuccess).toBe(true);

    (supabaseServer.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain(null, { message: "DB error" })),
    });
    result = await insertComparisonOutputStats("output-123", 100, 0.01);
    expect(result.isSuccess).toBe(false);

    (supabaseServer.from as any).mockReturnValue({ insert: vi.fn().mockReturnValue(mockChain([])) });
    result = await insertComparisonOutputStats("output-123", 100, 0.01);
    expect(result.isSuccess).toBe(false);
  });

  it("updateUsageAggregates handles success and errors", async () => {
    (supabaseServer.rpc as any).mockResolvedValue({ error: null });
    let result = await updateUsageAggregates("gpt-4", "user-1", "conv-1", 100, 0.01);
    expect(result.isSuccess).toBe(true);
    expect(supabaseServer.rpc).toHaveBeenCalledTimes(3);

    (supabaseServer.rpc as any).mockRejectedValue(new Error("RPC failed"));
    result = await updateUsageAggregates("gpt-4", "user-1", "conv-1", 100, 0.01);
    expect(result.isSuccess).toBe(false);
  });

  it("getUserComparisonConversations handles success and errors", async () => {
    const mockOrderChain = vi.fn().mockResolvedValue({ data: [{ id: "conv-1", title: "Test" }], error: null });
    (supabaseServer.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: mockOrderChain }) }),
    });
    let result = await getUserComparisonConversations("user-123");
    expect(result.isSuccess).toBe(true);

    mockOrderChain.mockResolvedValue({ data: null, error: { message: "DB error" } });
    result = await getUserComparisonConversations("user-123");
    expect(result.isSuccess).toBe(false);
  });

  it("getComparisonConversationPrompts handles success and errors", async () => {
    const mockConvChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi
            .fn()
            .mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: "conv-123" }, error: null }) }),
        }),
      }),
    };
    const mockPromptChain = {
      select: vi.fn().mockReturnValue({
        eq: vi
          .fn()
          .mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [{ id: "prompt-1" }], error: null }) }),
      }),
    };
    (supabaseServer.from as any).mockReturnValueOnce(mockConvChain).mockReturnValueOnce(mockPromptChain);

    let result = await getComparisonConversationPrompts("conv-123", "user-123");
    expect(result.isSuccess).toBe(true);

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
    result = await getComparisonConversationPrompts("conv-123", "user-123");
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
    const mockPromptExceptionChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error("Database exception")),
        }),
      }),
    };
    (supabaseServer.from as any)
      .mockReturnValueOnce(mockConvExceptionChain)
      .mockReturnValueOnce(mockPromptExceptionChain);
    result = await getComparisonConversationPrompts("conv-123", "user-123");
    expect(result.isSuccess).toBe(false);
    expect(result.error.type).toBe(ErrorType.DatabaseError);
    expect(result.error.message).toBe("Error fetching comparison conversation prompts");
  });
});
