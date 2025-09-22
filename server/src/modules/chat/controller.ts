import { Request, Response } from "express";
import { ErrorType } from "@shared/utils/error-type.js";
import { setupStreamHeaders, sendModelError, sendStreamComplete, sendUsage } from "@server/lib/stream/helpers.js";
import { streamModel } from "@server/lib/llm/streaming.js";

import { startChatStream } from "./service.js";
import { ModelStreamErrorData } from "@shared/types/comparison/model-stream-data.js";

export async function streamChat(req: Request, res: Response) {
  const result = await startChatStream(req.body);
  if (!result.isSuccess) {
    res.status(500).json({
      error: result.error.message,
      type: result.error.type,
    });
    return;
  }
  setupStreamHeaders(res);

  const { selectedModel, modelMessages, systemPrompt, useWebSearch } = result.value;

  try {
    const { success, usage } = await streamModel(res, selectedModel, modelMessages, systemPrompt, useWebSearch);
    if (!success) {
      res.status(500).json({
        error: "Streaming failed",
        type: ErrorType.InternalServerError,
      });
      return;
    }

    if (!usage) {
      res.status(204).json({ message: "No usage data available" });
      return;
    }

    sendUsage(res, selectedModel.modelId, usage);
    sendStreamComplete(res);
  } catch (error) {
    sendModelError(res, {
      error: String(error),
      errorType: ErrorType.InternalServerError,
    } as ModelStreamErrorData);
  }
}
