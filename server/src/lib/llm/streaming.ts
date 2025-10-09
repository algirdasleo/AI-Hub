import { Response } from "express";
import { streamResponse } from "@server/lib/llm/ai-manager.js";
import { ModelStreamBaseData, ModelStreamUsageDataSchema } from "@shared/types/comparison/model-stream-data.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { buildErrorPayload, buildUsagePayload } from "@server/lib/stream/payloads.js";
import { handleStreamPart } from "./helpers.js";
import { SelectedModel } from "@shared/config/model-schemas.js";
import { ModelMessage } from "ai";
import { sendModelError } from "../stream/helpers.js";
import { sendUsage } from "@server/lib/stream/helpers.js";
import { StreamResult } from "./types.js";

export async function streamModel(
  res: Response,
  selectedModel: SelectedModel,
  modelMessages: ModelMessage[],
  systemPrompt?: string,
  useWebSearch?: boolean,
): Promise<StreamResult> {
  const start = Date.now();
  let firstTokenSent = false;
  let latencyMs: number | undefined;
  let fullContent = "";

  try {
    const result = await streamResponse(selectedModel, systemPrompt, modelMessages, useWebSearch);
    if (!result.isSuccess) {
      sendModelError(res, buildErrorPayload(selectedModel.modelId, result.error.message, result.error.type));
      return { success: false };
    }

    const { fullStream, totalUsage } = result.value;

    for await (const part of fullStream) {
      if (!firstTokenSent && part.type === "text-delta") {
        latencyMs = Date.now() - start;
      }
      const result = handleStreamPart(res, part, firstTokenSent, start, selectedModel.modelId);
      firstTokenSent = result.firstTokenSent;
      if (!result.shouldContinue) return { success: false };
      if (part.type === "text-delta") {
        fullContent += part.text;
      }
    }

    const usage = await totalUsage;

    return { success: true, usage, content: fullContent, latencyMs };
  } catch (error) {
    sendModelError(res, buildErrorPayload(selectedModel.modelId, String(error), ErrorType.InternalServerError));
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
      if (v.success && v.usage) sendUsage(res, buildUsagePayload(m.selectedModel.modelId, v.usage));
      return v;
    }),
  );

  return Promise.allSettled(promises);
}
