import { describe, it, expect, vi, beforeEach } from "vitest";

import { extractModelsData, startMultiModelStream } from "../service.js";

import { Result } from "@shared/utils/result.js";

vi.mock("@server/lib/llm/streaming.js", () => ({
  streamMultipleModels: vi.fn(),
}));

import { streamMultipleModels } from "@server/lib/llm/streaming.js";

describe("comparison service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extractModelsData returns parsed models for valid params", async () => {
    const params = {
      models: [
        {
          provider: "OpenAI",
          modelId: "gpt-4",
          settings: {},
          messages: [{ id: "1", role: "user", parts: [{ type: "text", text: "hi" }] }],
        },
      ],
      systemPrompt: "helpful",
      useWebSearch: false,
    } as any;

    const result = await extractModelsData(params);

    expect(result.isSuccess).toBe(true);
    expect((result.value as any).parsedModels).toBeDefined();
  });

  it("startMultiModelStream calls streamMultipleModels with transformed models", async () => {
    const mockRes: any = { write: vi.fn(), end: vi.fn(), setHeader: vi.fn() };

    (streamMultipleModels as any).mockResolvedValue(Result.ok(undefined));

    const validatedModels = [
      {
        selectedModel: { provider: "openai", modelId: "gpt-4", settings: {} },
        modelMessages: [{ type: "message", role: "user", content: [{ type: "text", text: "hi" }] }],
      },
    ];

    await startMultiModelStream(mockRes as any, validatedModels as any, "prompt", false);

    expect(streamMultipleModels).toHaveBeenCalled();
  });
});
