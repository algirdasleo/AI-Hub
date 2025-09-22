import { ErrorType } from "@shared/utils/error-type.js";
import { ModelStreamTextData, ModelStreamErrorData } from "@shared/types/comparison/model-stream-data.js";

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
