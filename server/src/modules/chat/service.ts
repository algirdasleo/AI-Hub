import { ChatStreamParams } from "@shared/types/chat/index.js";
import { SelectedModelSchema } from "@shared/config/model-schemas.js";
import { Result } from "@shared/utils/result.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { Response } from "express";
import { LanguageModelV2Usage } from "@ai-sdk/provider";
import { streamModel } from "@server/lib/llm/streaming.js";
import { setupStreamHeaders, sendUsage, sendStreamComplete, buildUsagePayload } from "@server/lib/stream/index.js";
import {
  insertChatMessageStats,
  updateUsageAggregates,
  createChatConversation,
  addMessage,
} from "./repository.js";
import { MessageRole } from "@shared/types/chat/index.js";
import { ChatJobPayloadResult, ChatStreamExecutionParams } from "./types.js";
import { UserRole } from "@shared/types/auth/user.js";

export async function createChatJobPayload(
  userId: string,
  params: ChatStreamParams,
): Promise<Result<ChatJobPayloadResult>> {
  try {
    let convId = params.conversationId as string;
    if (!convId) {
      const title = params.title || params.prompt.split("?")[0].split(" ").slice(0, 6).join(" ");
      const convResult = await createChatConversation(userId, title);
      if (!convResult.isSuccess) {
        return Result.fail({ type: ErrorType.DatabaseError, message: "Failed to create chat conversation" });
      }
      convId = convResult.value.id;
    }

    const userMsgResult = await addMessage(convId, MessageRole.USER, params.prompt);
    if (!userMsgResult.isSuccess) {
      return Result.fail({ type: ErrorType.DatabaseError, message: "Failed to save user message" });
    }

    return Result.ok({
      conversationId: convId,
    });
  } catch (error) {
    return Result.fail({ type: ErrorType.InternalServerError, message: String(error) });
  }
}

export async function executeChatStream(
  res: Response,
  params: ChatStreamExecutionParams,
  userId: string,
): Promise<Result<void>> {
  try {
    const selectedModel = SelectedModelSchema.parse({
      provider: params.provider,
      modelId: params.modelId,
      settings: params.settings,
    });

    setupStreamHeaders(res);

    const { success, usage, latencyMs, content } = await streamModel(
      res,
      selectedModel,
      [{ role: UserRole.USER, content: params.prompt }],
      params.systemPrompt,
      params.useWebSearch,
    );

    if (!success) {
      return Result.fail({ type: ErrorType.StreamError, message: "Streaming failed" });
    }

    if (!usage) {
      return Result.fail({ type: ErrorType.InternalServerError, message: "No usage data" });
    }

    sendUsage(res, buildUsagePayload(selectedModel.modelId, usage));
    sendStreamComplete(res);

    if (content) {
      const assistantMsgResult = await addMessage(params.conversationId, MessageRole.ASSISTANT, content);
      if (!assistantMsgResult.isSuccess) {
        return Result.fail({ type: ErrorType.DatabaseError, message: "Failed to save assistant message" });
      }

      saveChatMessageStats(
        assistantMsgResult.value.id,
        selectedModel.modelId,
        userId,
        params.conversationId,
        usage,
        latencyMs,
      ).catch((err: unknown) => {
        console.warn("Failed to save chat message stats:", err);
      });
    }

    return Result.okVoid();
  } catch (error) {
    return Result.fail({ type: ErrorType.InternalServerError, message: String(error) });
  }
}

export async function saveChatMessageStats(
  messageId: string,
  model: string,
  userId: string,
  conversationId: string,
  usage: LanguageModelV2Usage,
  latencyMs?: number,
) {
  try {
    const totalTokens = usage.totalTokens || (usage.inputTokens || 0) + (usage.outputTokens || 0);
    const costUsd = totalTokens * 0.00001;

    await insertChatMessageStats(messageId, totalTokens, costUsd, latencyMs);
    await updateUsageAggregates(model, userId, conversationId, totalTokens, costUsd);
  } catch (err) {
    console.warn("Failed to save chat message stats", err);
  }
}
