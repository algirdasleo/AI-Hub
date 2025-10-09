import { ModelMessage, streamText } from "ai";
import { SelectedModel } from "@shared/config/index.js";
import { ErrorType, Result } from "@shared/utils/index.js";

import { PROVIDER_CLIENTS, validateAPIKey, createWebSearchTools } from "./helpers.js";

export async function streamResponse(
  model: SelectedModel,
  systemPrompt?: string,
  messages: ModelMessage[] = [],
  useWebSearch = false,
) {
  const apiKeyValidation = validateAPIKey(model.provider);
  if (!apiKeyValidation.isSuccess) {
    return Result.fail(apiKeyValidation.error);
  }

  const tools = createWebSearchTools(model.provider, useWebSearch);

  try {
    const { fullStream, totalUsage } = streamText({
      model: PROVIDER_CLIENTS[model.provider](model.modelId),
      system: systemPrompt,
      messages: messages,
      temperature: model.settings?.temperature,
      maxOutputTokens: model.settings?.maxOutputTokens,
      tools: tools,
    });

    return Result.ok({ fullStream, totalUsage });
  } catch (error) {
    return Result.fail({
      type: ErrorType.InternalServerError,
      message: "Failed to stream chat response",
      details: error,
    });
  }
}
