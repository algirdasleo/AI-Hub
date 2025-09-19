import { ComparisonStreamParams } from "@shared/types/comparison/comparison-request.js";
import { Result } from "@shared/utils/result.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { Response } from "express";
import { streamMultipleModels } from "@server/lib/llm/streaming.js";
import { ModelStreamBaseData } from "@shared/types/comparison/model-stream-data.js";
import { parseModels, StreamModelDetails } from "@server/lib/parse-models.js";

export async function extractModelsData(params: ComparisonStreamParams) {
  try {
    const { models, systemPrompt, useWebSearch } = params;
    const parsedModels: StreamModelDetails[] = parseModels(models);
    return Result.ok({ parsedModels, systemPrompt, useWebSearch });
  } catch (error) {
    return Result.fail({ type: ErrorType.InternalServerError, message: String(error) });
  }
}

export async function startMultiModelStream(
  res: Response,
  validatedModels: StreamModelDetails[],
  systemPrompt?: string,
  useWebSearch: boolean = false,
) {
  const models = validatedModels.map(({ selectedModel, modelMessages }, index) => ({
    selectedModel,
    modelMessages,
    modelInfo: { modelId: selectedModel.modelId, index } as ModelStreamBaseData,
  }));

  await streamMultipleModels(res, models, systemPrompt, useWebSearch);
}
