import { describe, it, expect } from "vitest";
import { ErrorType } from "@shared/utils/error-type.js";

import { buildTextPayload, buildErrorPayload } from "../payloads.js";

describe("stream payloads", () => {
  it("buildTextPayload includes modelInfo and text", () => {
    const payload = buildTextPayload({ modelId: "m1", index: 0 } as any, "hello");
    expect(payload).toEqual({ modelId: "m1", index: 0, text: "hello" });
  });

  it("buildErrorPayload includes modelInfo and error fields", () => {
    const payload = buildErrorPayload({ modelId: "m1", index: 0 } as any, "fail", ErrorType.StreamError);
    expect(payload).toEqual({ modelId: "m1", index: 0, error: "fail", errorType: ErrorType.StreamError });
  });
});
