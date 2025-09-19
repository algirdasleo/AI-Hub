import { describe, it, expect } from "vitest";

import * as streamHelpers from "../helpers.js";
import { makeMockRes, expectSSEEvent } from "../../../tests/testUtils.js";

describe("stream helpers SSE functions", () => {
  it("sendStreamComplete writes complete event and ends", () => {
    const mockRes = makeMockRes();
    streamHelpers.sendStreamComplete(mockRes as any);
    expectSSEEvent(mockRes, "complete");
    expect(mockRes.end).toHaveBeenCalled();
  });

  it("sendModelFirstToken writes model-first-token event", () => {
    const mockRes = makeMockRes();
    streamHelpers.sendModelFirstToken(mockRes as any, { modelId: "m1", index: 0, ms: 42 } as any);
    expectSSEEvent(mockRes, "model-first-token");
  });

  it("sendModelText writes model-text event", () => {
    const mockRes = makeMockRes();
    streamHelpers.sendModelText(mockRes as any, { modelId: "m1", index: 0, text: "hello" } as any);
    expectSSEEvent(mockRes, "model-text");
  });

  it("endModelStream writes model-stream-end and ends", () => {
    const mockRes = makeMockRes();
    streamHelpers.endModelStream(mockRes as any);
    expectSSEEvent(mockRes, "model-stream-end");
    expect(mockRes.end).toHaveBeenCalled();
  });
});
