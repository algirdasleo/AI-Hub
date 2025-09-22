import { describe, it, expect } from "vitest";
import { ErrorType } from "@shared/utils/error-type.js";

import { buildTextPayload, buildErrorPayload } from "../payloads.js";

describe("stream payloads", () => {
  it("buildTextPayload includes modelInfo and text", () => {
    const payload = buildTextPayload("m1", "hello");
    expect(payload).toEqual({ modelId: "m1", text: "hello" });
  });

  it("buildErrorPayload includes modelInfo and error fields", () => {
    const payload = buildErrorPayload("m1", "fail", ErrorType.StreamError);
    expect(payload).toEqual({ modelId: "m1", error: "fail", errorType: ErrorType.StreamError });
  });
});
