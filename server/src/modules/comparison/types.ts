import { ComparisonStreamParams } from "@shared/types/comparison/comparison-request.js";

export type ComparisonJobPayloadResult = {
  conversationId: string;
  promptId: string;
};

export type ComparisonStreamExecutionParams = ComparisonStreamParams & {
  conversationId: string;
  promptId: string;
};
