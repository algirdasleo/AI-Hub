import { ErrorType } from "@shared/utils/error-type.js";
import {
  ModelStreamBaseData,
  ModelStreamTextData,
  ModelStreamErrorData,
} from "@shared/types/comparison/model-stream-data.js";

export function buildTextPayload(modelInfo: ModelStreamBaseData, text: string) {
  return {
    ...modelInfo,
    text,
  } as ModelStreamTextData;
}

export function buildErrorPayload(modelInfo: ModelStreamBaseData, error: string, errorType: ErrorType) {
  return {
    ...modelInfo,
    error,
    errorType,
  } as ModelStreamErrorData;
}
