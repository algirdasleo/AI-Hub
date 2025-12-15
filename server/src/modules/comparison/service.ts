import { ComparisonStreamParams } from "@shared/types/comparison/comparison-request.js";
import { Result } from "@shared/utils/result.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { Response } from "express";
import { streamMultipleModels } from "@server/lib/llm/streaming.js";
import { ModelStreamBaseData } from "@shared/types/comparison/model-stream-data.js";
import { SelectedModel, SelectedModelSchema } from "@shared/config/model-schemas.js";
import { SettledResult } from "@server/lib/llm/types.js";
import { setupStreamHeaders, sendStreamComplete } from "@server/lib/stream/helpers.js";
import { mapComparisonRepositoryToModelMessages } from "@server/lib/llm/helpers.js";
import {
  insertComparisonOutput,
  insertComparisonOutputStats,
  updateUsageAggregates,
  createComparisonConversation,
  insertComparisonPrompt,
  getComparisonConversationPrompts,
} from "./repository.js";
import { ComparisonJobPayloadResult, ComparisonStreamExecutionParams } from "./types.js";

export async function createComparisonJobPayload(
  userId: string,
  params: ComparisonStreamParams,
): Promise<Result<ComparisonJobPayloadResult>> {
  try {
    let convId = params.conversationId as string;
    if (!convId) {
      const title = params.title || params.prompt.split("?")[0].split(" ").slice(0, 6).join(" ");
      const convResult = await createComparisonConversation(userId, title);
      if (!convResult.isSuccess) {
        return Result.fail({ type: ErrorType.DatabaseError, message: "Failed to create comparison conversation" });
      }
      convId = convResult.value.id;
    }

    const promptResult = await insertComparisonPrompt(convId, params.prompt);
    if (!promptResult.isSuccess) {
      return Result.fail({ type: ErrorType.DatabaseError, message: "Failed to create comparison prompt" });
    }

    return Result.ok({
      conversationId: convId,
      promptId: promptResult.value.id,
    });
  } catch (error) {
    return Result.fail({ type: ErrorType.InternalServerError, message: String(error) });
  }
}

export async function executeComparisonStream(
  res: Response,
  params: ComparisonStreamExecutionParams,
  userId: string,
): Promise<Result<void>> {
  try {
    const parsedModels: SelectedModel[] = params.models.map((model) =>
      SelectedModelSchema.parse({
        provider: model.provider,
        modelId: model.modelId,
        settings: model.settings,
      }),
    );

    setupStreamHeaders(res);

    const promptsResult = await getComparisonConversationPrompts(params.conversationId, userId);

    const models = parsedModels.map((selectedModel) => {
      const currentUserMessage = { role: "user" as const, content: params.prompt };
      let modelMessages: any[] = [currentUserMessage];

      if (promptsResult.isSuccess && promptsResult.value.length > 0) {
        const previousMessages = mapComparisonRepositoryToModelMessages(
          promptsResult.value,
          selectedModel.modelId,
        );
        modelMessages = [...previousMessages, currentUserMessage];
      }

      return {
        selectedModel,
        modelMessages,
        modelInfo: { modelId: selectedModel.modelId } as ModelStreamBaseData,
      };
    });

    const settledResults = await streamMultipleModels(res, models, params.systemPrompt, params.useWebSearch);

    sendStreamComplete(res);

    await saveComparisonResults(
      settledResults,
      parsedModels,
      params.promptId,
      userId,
      params.conversationId,
    ).catch((err: unknown) => {
      console.warn("Failed to save comparison results:", err);
    });
    return Result.okVoid();
  } catch (error) {
    return Result.fail({ type: ErrorType.InternalServerError, message: String(error) });
  }
}

export async function saveComparisonResults(
  settledResults: SettledResult[],
  validatedModels: SelectedModel[],
  promptId: string,
  userId: string,
  conversationId: string,
) {
  for (let i = 0; i < settledResults.length; i++) {
    const settled = settledResults[i];
    const model = validatedModels[i];

    if (settled.status === "fulfilled" && settled.value?.success && settled.value.content) {
      try {
        const outputResult = await insertComparisonOutput(
          promptId,
          model.modelId,
          "assistant",
          settled.value.content,
        );

        if (outputResult.isSuccess && settled.value.usage) {
          const usage = settled.value.usage;
          const totalTokens = usage.totalTokens || (usage.inputTokens || 0) + (usage.outputTokens || 0);
          const costUsd = totalTokens * 0.00001;

          const latencyMs = settled.value.latencyMs;
          await insertComparisonOutputStats(outputResult.value.id, totalTokens, costUsd, latencyMs);
          await updateUsageAggregates(model.modelId, userId, conversationId, totalTokens, costUsd);
        }
      } catch (err) {
        console.warn("Failed to persist comparison output/stats", err);
      }
    }
  }
}
