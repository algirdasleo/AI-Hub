import { describe, it, expect, vi, beforeEach } from "vitest";
import { Result } from "@shared/utils/result.js";

import { streamChat } from "../controller.js";

vi.mock("../service.js", () => ({
  startChatStream: vi.fn(),
}));

import { startChatStream } from "../service.js";

vi.mock("@server/lib/llm/streaming.js", () => ({
  streamModel: vi.fn(),
}));

import { streamModel } from "@server/lib/llm/streaming.js";

describe("chat controller", () => {
  let mockReq: any;
  let mockRes: any;
  const mockStartChatStream = startChatStream as any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = { body: { messages: [], model: {} } };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };
  });

  it("handles service failure", async () => {
    mockStartChatStream.mockResolvedValue(Result.fail({ type: "InvalidParameters", message: "bad input" }));

    await streamChat(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "bad input",
      type: "InvalidParameters",
    });
  });

  it("handles successful stream", async () => {
    mockStartChatStream.mockResolvedValue(
      Result.ok({
        selectedModel: { modelId: "m1" },
        modelMessages: [],
        systemPrompt: undefined,
        useWebSearch: false,
      }),
    );

    (streamModel as any).mockImplementation(async (res: any) => {
      res.write("event: text\ndata: hello\n\n");
      res.end();
      return { success: true };
    });

    await streamChat(mockReq, mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(mockRes.write).toHaveBeenCalledWith("event: text\ndata: hello\n\n");
    expect(mockRes.end).toHaveBeenCalled();
  });

  it("handles stream errors", async () => {
    mockStartChatStream.mockResolvedValue(
      Result.ok({
        selectedModel: { modelId: "m1" },
        modelMessages: [],
        systemPrompt: undefined,
        useWebSearch: false,
      }),
    );

    (streamModel as any).mockImplementation(async (res: any) => {
      res.write(
        `event: model-error\ndata: ${JSON.stringify({ modelId: "m1", index: 0, error: "stream failed", errorType: "StreamError" })}\n\n`,
      );
      return { success: false };
    });

    await streamChat(mockReq, mockRes);

    expect(mockRes.write).toHaveBeenCalledWith(
      `event: model-error\ndata: ${JSON.stringify({ modelId: "m1", index: 0, error: "stream failed", errorType: "StreamError" })}\n\n`,
    );
  });

  it("handles stream unexpected exceptions", async () => {
    mockStartChatStream.mockResolvedValue(
      Result.ok({
        selectedModel: { modelId: "m1" },
        modelMessages: [],
        systemPrompt: undefined,
        useWebSearch: false,
      }),
    );

    (streamModel as any).mockImplementation(async () => {
      throw new Error("unexpected error");
    });

    await streamChat(mockReq, mockRes);

    expect(mockRes.write).toHaveBeenCalledWith(
      `event: model-error\ndata: ${JSON.stringify({ error: String(new Error("unexpected error")), errorType: "InternalServerError" })}\n\n`,
    );
  });
});
