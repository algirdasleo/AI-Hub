import { ChatStreamParams } from "@shared/types/chat/index.js";
import { parseModel } from "@server/lib/parse-models.js";
import { Result } from "@shared/utils/result.js";
import { ErrorType } from "@shared/utils/error-type.js";

export async function startChatStream(params: ChatStreamParams) {
  try {
    const { model, systemPrompt, useWebSearch } = params;
    const { selectedModel, modelMessages } = parseModel({
      provider: model.provider,
      modelId: model.modelId,
      settings: model.settings,
      messages: model.messages,
    });

    return Result.ok({ selectedModel, modelMessages, systemPrompt, useWebSearch });
  } catch (error) {
    return Result.fail({ type: ErrorType.InternalServerError, message: String(error) });
  }
}
