import { parseModels } from "@server/lib/parse-models.js";
import { describe, it, expect } from "vitest";

describe("comparison helpers", () => {
  it("parses models with history into stream details", () => {
    const modelsWithHistory = [
      {
        provider: "OpenAI",
        modelId: "gpt-4",
        settings: {},
        messages: [{ id: "1", role: "user", parts: [{ type: "text", text: "hello" }] }],
      },
    ];

    const result = parseModels(modelsWithHistory as any);

    expect(result).toHaveLength(1);
    expect(result[0].selectedModel.modelId).toBe("gpt-4");
    expect(result[0].modelMessages.length).toBeGreaterThan(0);
  });
});
