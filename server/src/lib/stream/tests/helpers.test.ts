import { describe, it, expect } from "vitest";

import * as streamHelpers from "../helpers.js";
import { makeMockRes, expectSSEEvent } from "../../../tests/testUtils.js";

describe("stream helpers SSE functions", () => {
  it("setupStreamHeaders sets all required headers", () => {
    const mockRes = makeMockRes();
    streamHelpers.setupStreamHeaders(mockRes as any);

    expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(mockRes.setHeader).toHaveBeenCalledWith("Cache-Control", "no-cache");
    expect(mockRes.setHeader).toHaveBeenCalledWith("Connection", "keep-alive");
    expect(mockRes.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
  });

  it("sendStreamComplete writes complete event and ends", () => {
    const mockRes = makeMockRes();
    streamHelpers.sendStreamComplete(mockRes as any);
    expectSSEEvent(mockRes, "complete");
    expect(mockRes.end).toHaveBeenCalled();
  });

  it("sendModelText writes model-text event", () => {
    const mockRes = makeMockRes();
    streamHelpers.sendModelText(mockRes as any, { modelId: "m1", text: "hello" } as any);
    expectSSEEvent(mockRes, "model-text");
  });

  it("sendLatencyMs writes model-latency-ms event", () => {
    const mockRes = makeMockRes();
    streamHelpers.sendLatencyMs(mockRes as any, { modelId: "m1", ms: 42 } as any);
    expectSSEEvent(mockRes, "model-latency-ms");
  });

  it("sendModelError writes model-error event", () => {
    const mockRes = makeMockRes();
    streamHelpers.sendModelError(
      mockRes as any,
      { modelId: "m1", error: "test error", errorType: "TestError" } as any,
    );
    expectSSEEvent(mockRes, "model-error");
  });
});
