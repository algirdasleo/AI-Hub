import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIProvider } from "@shared/config/model-schemas.js";

vi.mock("@server/lib/llm/ai-manager.js", () => ({
  streamResponse: vi.fn(),
}));

import { streamResponse } from "@server/lib/llm/ai-manager.js";

import { streamModel, streamMultipleModels } from "../streaming.js";

describe("streaming", () => {
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = { write: vi.fn() };
  });

  it("streamModel returns success and usage when streamResponse succeeds", async () => {
    const mockStream = async function* () {
      yield { type: "text-delta", text: "x" };
    };
    (streamResponse as any).mockResolvedValue({
      isSuccess: true,
      value: { fullStream: mockStream(), totalUsage: Promise.resolve({}) },
    });

    const res = await streamModel(
      mockRes as any,
      { provider: AIProvider.OpenAI, modelId: "m1" },
      [],
      undefined,
      false,
    );

    expect(res.success).toBe(true);
    expect(res.usage).toBeDefined();
  });

  it("streamModel returns failure when streamResponse fails", async () => {
    (streamResponse as any).mockResolvedValue({ isSuccess: false, error: { message: "bad", type: "err" } });

    const res = await streamModel(
      mockRes as any,
      { provider: AIProvider.OpenAI, modelId: "m1" },
      [],
      undefined,
      false,
    );

    expect(res.success).toBe(false);
  });

  it("streamMultipleModels resolves all settled", async () => {
    const mockStream = async function* () {
      yield { type: "text-delta", text: "x" };
    };
    (streamResponse as any).mockResolvedValue({
      isSuccess: true,
      value: { fullStream: mockStream(), totalUsage: Promise.resolve({}) },
    });

    const results = await streamMultipleModels(mockRes as any, [
      {
        selectedModel: { provider: AIProvider.OpenAI, modelId: "m1" },
        modelMessages: [],
        modelInfo: { modelId: "m1" },
      },
      {
        selectedModel: { provider: AIProvider.Anthropic, modelId: "m2" },
        modelMessages: [],
        modelInfo: { modelId: "m2" },
      },
    ]);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(2);
  });
});
