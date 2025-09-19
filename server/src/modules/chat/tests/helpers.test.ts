import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendModelError, setupStreamHeaders } from "@server/lib/stream/helpers.js";
import { ErrorType } from "@shared/utils/error-type.js";

import { handleStreamPart } from "../helpers.js";

describe("chat helpers", () => {
  let mockRes: any;

  beforeEach(() => {
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };
  });

  it("sendModelError writes model-error SSE event", () => {
    sendModelError(mockRes, {
      modelId: "server",
      index: 0,
      error: "test error",
      errorType: ErrorType.InternalServerError,
    });

    expect(mockRes.write).toHaveBeenCalledWith(
      `event: model-error\ndata: ${JSON.stringify({ modelId: "server", index: 0, error: "test error", errorType: ErrorType.InternalServerError })}\n\n`,
    );
  });

  it("setupStreamHeaders sets correct SSE headers", () => {
    setupStreamHeaders(mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(mockRes.setHeader).toHaveBeenCalledWith("Cache-Control", "no-cache");
    expect(mockRes.setHeader).toHaveBeenCalledWith("Connection", "keep-alive");
    expect(mockRes.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
  });

  it("handleStreamPart handles text-delta", () => {
    const result = handleStreamPart(mockRes, { type: "text-delta", id: "1", text: "hello" });

    expect(result).toBe(true);
    expect(mockRes.write).toHaveBeenCalledWith(
      `event: model-text\ndata: ${JSON.stringify({ modelId: "server", index: 0, text: "hello" })}\n\n`,
    );
  });

  it("handleStreamPart handles error", () => {
    const result = handleStreamPart(mockRes, { type: "error", error: "failed" });

    expect(result).toBe(false);
    expect(mockRes.write).toHaveBeenCalledWith(
      `event: model-error\ndata: ${JSON.stringify({ error: "failed", type: ErrorType.StreamError })}\n\n`,
    );
  });

  it("handleStreamPart ignores unknown part types", () => {
    const result = handleStreamPart(mockRes, { type: "raw" } as any);

    expect(result).toBe(true);
    expect(mockRes.write).not.toHaveBeenCalled();
  });

  it("handleStreamPart handles abort", () => {
    const result = handleStreamPart(mockRes, { type: "abort" });

    expect(result).toBe(false);
    expect(mockRes.write).toHaveBeenCalledWith("event: model-stream-end\ndata: [DONE]\n\n");
    expect(mockRes.end).toHaveBeenCalled();
  });

  it("handleStreamPart handles tool-error", () => {
    const result = handleStreamPart(mockRes, {
      type: "tool-error",
      error: "tool failed",
      toolCallId: "1",
      toolName: "t",
      input: {},
    } as any);

    expect(result).toBe(false);
    expect(mockRes.write).toHaveBeenCalledWith(
      `event: model-error\ndata: ${JSON.stringify({ modelId: "server", index: 0, error: "tool failed", errorType: ErrorType.StreamToolError })}\n\n`,
    );
  });
});
