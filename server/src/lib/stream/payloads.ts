import { ErrorType } from "@shared/utils/error-type.js";
import {
  ModelStreamTextData,
  ModelStreamErrorData,
  ModelStreamLatencyData,
  ModelStreamUsageData,
} from "@shared/types/comparison/model-stream-data.js";
import { LanguageModelV2Usage } from "@ai-sdk/provider";

export function buildTextPayload(modelId: string, text: string) {
  return {
    modelId,
    text,
  } as ModelStreamTextData;
}

export function buildErrorPayload(modelId: string, error: string, errorType: ErrorType) {
  return {
    modelId,
    error,
    errorType,
  } as ModelStreamErrorData;
}

export function buildLatencyMsPayload(modelId: string, ms: number) {
  return {
    modelId,
    ms,
  } as ModelStreamLatencyData;
}

export function buildUsagePayload(modelId: string, usage: LanguageModelV2Usage) {
  return {
    modelId,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
  } as ModelStreamUsageData;
}
