import { LanguageModelV2Usage } from "@ai-sdk/provider";

export type StreamResult = {
  success: boolean;
  content?: string;
  usage?: LanguageModelV2Usage;
  latencyMs?: number;
};

export type SettledResult = PromiseSettledResult<StreamResult>;
