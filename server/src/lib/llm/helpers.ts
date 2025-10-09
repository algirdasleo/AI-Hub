import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { AIProvider } from "@shared/config/index.js";
import { ErrorType, Result } from "@shared/utils/index.js";
import { TextStreamPart, ToolSet } from "ai";
import { Response } from "express";
import { ModelStreamBaseData, ModelStreamLatencyData } from "@shared/types/comparison/model-stream-data.js";
import { buildErrorPayload, buildLatencyMsPayload, buildTextPayload } from "@server/lib/stream/payloads.js";
import { sendModelError, sendModelText, sendLatencyMs } from "@server/lib/stream/helpers.js";

export const PROVIDER_CLIENTS = {
  [AIProvider.OpenAI]: openai,
  [AIProvider.Anthropic]: anthropic,
  [AIProvider.Google]: google,
} as const;

export const API_KEYS = {
  [AIProvider.OpenAI]: process.env.OPENAI_API_KEY,
  [AIProvider.Anthropic]: process.env.ANTHROPIC_API_KEY,
  [AIProvider.Google]: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
};

export function validateAPIKey(provider: AIProvider) {
  if (!API_KEYS[provider]) {
    return Result.fail({
      type: ErrorType.ConfigurationError,
      message: `Missing API key for provider: ${provider}`,
    });
  }
  return Result.ok(true);
}

export function getWebSearchTool(provider: AIProvider) {
  switch (provider) {
    case AIProvider.Anthropic:
      return anthropic.tools.webSearch_20250305;
    case AIProvider.OpenAI:
      return openai.tools.webSearch;
    case AIProvider.Google:
      return google.tools.googleSearch;
    default:
      return null;
  }
}

export function createWebSearchTools(provider: AIProvider, useWebSearch: boolean) {
  if (!useWebSearch) {
    return undefined;
  }

  const webSearchTool = getWebSearchTool(provider);
  if (!webSearchTool) {
    return undefined;
  }

  return { web_search: webSearchTool({ maxUses: 3 }) } as ToolSet;
}

export function handleStreamPart(
  res: Response,
  part: TextStreamPart<ToolSet>,
  firstTokenSent: boolean,
  start: number,
  modelId: string,
) {
  switch (part.type) {
    case "text-delta": {
      if (!firstTokenSent) {
        const latencyMs = Date.now() - start;
        sendLatencyMs(res, buildLatencyMsPayload(modelId, latencyMs));
        firstTokenSent = true;
      }

      sendModelText(res, buildTextPayload(modelId, part.text));
      return { shouldContinue: true, firstTokenSent };
    }
    case "error": {
      const errorPayload = buildErrorPayload(modelId, String(part.error), ErrorType.StreamError);
      sendModelError(res, errorPayload);
      return { shouldContinue: false, firstTokenSent };
    }
    case "tool-error": {
      const toolErrorPayload = buildErrorPayload(modelId, String(part.error), ErrorType.StreamToolError);
      sendModelError(res, toolErrorPayload);
      return { shouldContinue: false, firstTokenSent };
    }
  }
  return { shouldContinue: true, firstTokenSent };
}
