import { ChatStreamParams } from "@shared/types/chat/index.js";
import { SelectedModelSchema } from "@shared/config/model-schemas.js";
import { Result } from "@shared/utils/result.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { Response } from "express";
import { LanguageModelV2Usage } from "@ai-sdk/provider";
import { streamModel } from "@server/lib/llm/streaming.js";
import { setupStreamHeaders, sendUsage, sendStreamComplete, buildUsagePayload } from "@server/lib/stream/index.js";
import { mapChatRepositoryToModelMessages } from "@server/lib/llm/helpers.js";
import {
  insertChatMessageStats,
  updateUsageAggregates,
  createChatConversation,
  addMessage,
  getConversationMessages,
} from "./repository.js";
import {
  createProjectConversation,
  addProjectMessage,
  getProjectConversationMessages,
  insertProjectMessageStats,
} from "@server/modules/projects/conversation-repository.js";
import { MessageRole } from "@shared/types/chat/index.js";
import { ChatJobPayloadResult, ChatStreamExecutionParams } from "./types.js";
import { queryDocumentsWithRAG } from "@server/modules/projects/service.js";
import { recordUsedDocument, getProjectDocuments } from "@server/modules/projects/repository.js";

async function createConversation(
  projectId: string | undefined,
  userId: string,
  title: string,
): Promise<Result<string>> {
  if (projectId) {
    const result = await createProjectConversation(projectId, userId, title);
    return result.isSuccess ? Result.ok(result.value.id) : Result.fail(result.error);
  }
  const result = await createChatConversation(userId, title);
  return result.isSuccess ? Result.ok(result.value.id) : Result.fail(result.error);
}

async function addUserMessage(
  convId: string,
  projectId: string | undefined,
  content: string,
): Promise<Result<void>> {
  if (projectId) {
    const result = await addProjectMessage(convId, MessageRole.USER, content);
    return result.isSuccess ? Result.ok(undefined) : Result.fail(result.error);
  }
  const result = await addMessage(convId, MessageRole.USER, content);
  return result.isSuccess ? Result.ok(undefined) : Result.fail(result.error);
}

async function addAssistantMessage(
  convId: string,
  projectId: string | undefined,
  content: string,
  model?: string,
): Promise<Result<any>> {
  if (projectId) {
    return await addProjectMessage(convId, MessageRole.ASSISTANT, content, model);
  }
  return await addMessage(convId, MessageRole.ASSISTANT, content, model);
}

export async function createChatJobPayload(
  userId: string,
  params: ChatStreamParams,
): Promise<Result<ChatJobPayloadResult>> {
  try {
    let convId = params.conversationId as string;

    if (!convId) {
      const title = params.title || params.prompt.split("?")[0].split(" ").slice(0, 6).join(" ");
      const convResult = await createConversation(params.projectId, userId, title);
      if (!convResult.isSuccess) {
        return Result.fail(convResult.error);
      }
      convId = convResult.value;
    }

    const msgResult = await addUserMessage(convId, params.projectId, params.prompt);
    if (!msgResult.isSuccess) {
      return Result.fail(msgResult.error);
    }

    return Result.ok({ conversationId: convId });
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

    const getMessagesFn = params.projectId
      ? () => getProjectConversationMessages(params.conversationId, params.projectId as string, userId)
      : () => getConversationMessages(params.conversationId, userId);
    const messagesResult = await getMessagesFn();

    const DEFAULT_SYSTEM_PROMPT =
      "You are a helpful AI assistant. Provide clear, concise, and accurate responses.";
    const currentUserMessage = { role: "user" as const, content: params.prompt };
    let conversationMessages: any[] = [currentUserMessage];
    let systemPrompt = params.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    let usedChunks: Array<{ id: string; document_id: string; relevance_score: number }> = [];

    if (messagesResult.isSuccess && messagesResult.value.length > 0) {
      const previousMessages = mapChatRepositoryToModelMessages(messagesResult.value.slice(0, -1));
      conversationMessages = [...previousMessages, currentUserMessage];
    }

    if (params.projectId) {
      const docsResult = await getProjectDocuments(params.projectId);
      const docNames =
        docsResult.isSuccess && docsResult.value.length > 0
          ? docsResult.value
              .filter((doc: any) => doc.status === "ready")
              .map((doc: any) => `- ${doc.file_name}`)
              .join("\n")
          : "";
      const documentsList = docNames
        ? `\n\nThe following documents are available in this project:\n${docNames}`
        : "";

      const ragResult = await queryDocumentsWithRAG(params.projectId, params.prompt);
      if (ragResult.isSuccess && ragResult.value.length > 0) {
        const relevantChunks = ragResult.value as Array<{
          chunkText: string;
          relevanceScore: number;
          fileName?: string;
        }>;

        const contextChunks = relevantChunks.map((chunk: any) => `- ${chunk.chunkText}`).join("\n\n");
        systemPrompt = `${systemPrompt}\n\nYou have access to the following document context that may help answer the user's question:\n\n${contextChunks}${documentsList}\n\nUse this context to provide a more informed and accurate response. If the context is relevant, cite the information used.\n\nAnswer in Markdown Format.`;
      } else if (documentsList) {
        systemPrompt = `${systemPrompt}${documentsList}`;
      }
    }

    if (!systemPrompt || !systemPrompt.trim()) {
      systemPrompt = DEFAULT_SYSTEM_PROMPT;
    }

    const { success, usage, latencyMs, content } = await streamModel(
      res,
      selectedModel,
      conversationMessages,
      systemPrompt,
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
      const assistantMsgResult = await addAssistantMessage(
        params.conversationId,
        params.projectId,
        content,
        selectedModel.modelId,
      );

      if (!assistantMsgResult.isSuccess) {
        return Result.fail({ type: ErrorType.DatabaseError, message: "Failed to save assistant message" });
      }

      if (params.projectId && usedChunks.length > 0) {
        for (const chunk of usedChunks) {
          await recordUsedDocument(
            assistantMsgResult.value.id,
            chunk.document_id,
            chunk.id,
            chunk.relevance_score,
          );
        }
      }

      saveChatMessageStats(
        assistantMsgResult.value.id,
        selectedModel.modelId,
        userId,
        params.conversationId,
        usage,
        latencyMs,
        params.projectId,
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
  projectId?: string,
) {
  try {
    const totalTokens = usage.totalTokens || (usage.inputTokens || 0) + (usage.outputTokens || 0);
    const costUsd = totalTokens * 0.00001;

    if (projectId) {
      await insertProjectMessageStats(messageId, totalTokens, costUsd, latencyMs);
    } else {
      await insertChatMessageStats(messageId, totalTokens, costUsd, latencyMs);
    }

    if (!projectId) {
      await updateUsageAggregates(model, userId, conversationId, totalTokens, costUsd);
    }
  } catch (err) {
    console.warn("Failed to save chat message stats", err);
  }
}
