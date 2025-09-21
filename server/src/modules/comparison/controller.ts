import { Request, Response } from "express";
import { ErrorType } from "@shared/utils/error-type.js";
import { sendModelError, setupStreamHeaders, sendStreamComplete } from "@server/lib/stream/helpers.js";

import { extractModelsData, startMultiModelStream } from "./index.js";
import { ModelStreamErrorData } from "@shared/types/comparison/model-stream-data.js";

export async function streamComparison(req: Request, res: Response) {
  const result = await extractModelsData(req.body);
  if (!result.isSuccess) {
    res.status(500).json({
      error: result.error.message,
      type: result.error.type,
    });
    return;
  }

  setupStreamHeaders(res);

  const { parsedModels, systemPrompt, useWebSearch } = result.value;

  try {
    await startMultiModelStream(res, parsedModels, systemPrompt, useWebSearch);
    sendStreamComplete(res);
  } catch (error) {
    sendModelError(res, {
      modelId: "server",
      index: 0,
      error: String(error),
      errorType: ErrorType.InternalServerError,
    } as ModelStreamErrorData);
    res.end();
  }
}
