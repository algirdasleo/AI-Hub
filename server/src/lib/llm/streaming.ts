import { Response } from "express";
import { streamResponse } from "@server/lib/llm/ai-manager.js";
import { ModelStreamBaseData } from "@shared/types/comparison/model-stream-data.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { buildErrorPayload } from "@server/lib/stream/payloads.js";
import { handleStreamPart } from "./helpers.js";
import { SelectedModel } from "@shared/config/model-schemas.js";
import { ModelMessage } from "ai";
import { sendModelError } from "../stream/helpers.js";
import { sendUsage } from "@server/lib/stream/helpers.js";

export async function streamModel(
  res: Response,
  selectedModel: SelectedModel,
  modelMessages: ModelMessage[],
  systemPrompt?: string,
  useWebSearch?: boolean,
) {
  const start = Date.now();
  let firstTokenSent = false;

  try {
    const result = await streamResponse(selectedModel, systemPrompt, modelMessages, useWebSearch);
    if (!result.isSuccess) {
      const payload = buildErrorPayload(selectedModel.modelId, result.error.message, result.error.type);
      sendModelError(res, payload);
      return { success: false };
    }

    const { fullStream, totalUsage } = result.value;

    for await (const part of fullStream) {
      const result = handleStreamPart(res, part, firstTokenSent, start, selectedModel.modelId);
      firstTokenSent = result.firstTokenSent;
      if (!result.shouldContinue) return { success: false };
    }

    const usage = await totalUsage;
    return { success: true, usage };
  } catch (error) {
    const payload = buildErrorPayload(selectedModel.modelId, String(error), ErrorType.InternalServerError);
    sendModelError(res, payload);
    return { success: false };
  }
}

export async function streamMultipleModels(
  res: Response,
  models: Array<{ selectedModel: SelectedModel; modelMessages: ModelMessage[]; modelInfo: ModelStreamBaseData }>,
  systemPrompt?: string,
  useWebSearch?: boolean,
) {
  const promises = models.map((m) =>
    streamModel(res, m.selectedModel, m.modelMessages, systemPrompt, useWebSearch).then((v) => {
      if (v?.success && v.usage) sendUsage(res, m.selectedModel.modelId, v.usage);
      return v;
    }),
  );

  return Promise.allSettled(promises);
}
