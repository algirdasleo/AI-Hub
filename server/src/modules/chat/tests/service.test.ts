import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIProvider } from "@shared/config/index.js";
import { Result } from "@shared/utils/result.js";

import { startChatStream } from "../service.js";

describe("service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes valid chat params", async () => {
    const params = {
      model: {
        provider: AIProvider.OpenAI,
        modelId: "gpt-4",
        messages: [
          {
            id: "1",
            role: "user" as const,
            parts: [{ type: "text" as const, text: "hello" }],
          },
        ],
      },
      systemPrompt: "helpful",
    } as any;

    const result = await startChatStream(params);

    expect(result.isSuccess).toBe(true);
    const payload = result.value;
    expect(payload.selectedModel.modelId).toBe("gpt-4");
  });

  it("handles invalid params", async () => {
    const invalidParams = {
      model: { provider: "invalid", modelId: "test" },
      messages: [],
    };

    const result = await startChatStream(invalidParams as any);

    expect(result.isSuccess).toBe(false);
  });
});
