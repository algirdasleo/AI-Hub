import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../index.js", () => ({
  extractModelsData: vi.fn(),
  startMultiModelStream: vi.fn(),
}));

vi.mock("@server/lib/stream/helpers.js", () => ({
  sendModelError: vi.fn(),
  setupStreamHeaders: vi.fn(),
  sendStreamComplete: vi.fn(),
}));

import { setupStreamHeaders, sendStreamComplete, sendModelError } from "@server/lib/stream/helpers.js";
import { ErrorType } from "@shared/utils/error-type.js";

import { streamComparison } from "../controller.js";
import { extractModelsData, startMultiModelStream } from "../index.js";

describe("comparison controller", () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = { body: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    };
  });

  it("returns 500 when extractModelsData fails", async () => {
    (extractModelsData as any).mockResolvedValue({ isSuccess: false, error: { message: "bad", type: "err" } });

    await streamComparison(mockReq as any, mockRes as any);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "bad", type: "err" });
  });

  it("sets headers and starts stream on success", async () => {
    const parsedModels = [{ selectedModel: {}, modelMessages: [] }];
    (extractModelsData as any).mockResolvedValue({
      isSuccess: true,
      value: { parsedModels, systemPrompt: "p", useWebSearch: true },
    });
    (startMultiModelStream as any).mockResolvedValue(undefined);

    await streamComparison(mockReq as any, mockRes as any);

    expect(setupStreamHeaders).toHaveBeenCalledWith(mockRes);
    expect(startMultiModelStream).toHaveBeenCalledWith(mockRes, parsedModels, "p", true);
    expect(sendStreamComplete).toHaveBeenCalledWith(mockRes);
  });

  it("calls sendError when startMultiModelStream throws", async () => {
    const parsedModels: any[] = [];
    (extractModelsData as any).mockResolvedValue({
      isSuccess: true,
      value: { parsedModels, systemPrompt: "p", useWebSearch: false },
    });
    (startMultiModelStream as any).mockRejectedValue(new Error("fail"));

    await streamComparison(mockReq as any, mockRes as any);

    expect(sendModelError).toHaveBeenCalledWith(mockRes, {
      modelId: "server",
      index: 0,
      error: String(new Error("fail")),
      errorType: ErrorType.InternalServerError,
    });
    expect(mockRes.end).toHaveBeenCalled();
  });
});
