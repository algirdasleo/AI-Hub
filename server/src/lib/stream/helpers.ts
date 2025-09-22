import { Response } from "express";
import { ErrorType } from "@shared/utils/error-type.js";
import { TimeToFirstToken } from "@shared/types/chat/statistics/time-to-first-token.js";
import { LanguageModelV2Usage } from "@ai-sdk/provider";
import {
  ModelStreamErrorData,
  ModelStreamFirstTokenData,
  ModelStreamTextData,
} from "@shared/types/comparison/model-stream-data.js";

export function setupStreamHeaders(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
}

export function sendStreamComplete(res: Response) {
  res.write(`event: complete\ndata: [DONE]\n\n`);
  res.end();
}

export function sendModelError(res: Response, payload: ModelStreamErrorData) {
  res.write(`event: model-error\ndata: ${JSON.stringify(payload)}\n\n`);
}

export function sendModelText(res: Response, payload: ModelStreamTextData) {
  res.write(`event: model-text\ndata: ${JSON.stringify(payload)}\n\n`);
}

export function sendModelFirstToken(res: Response, payload: ModelStreamFirstTokenData) {
  res.write(`event: model-first-token\ndata: ${JSON.stringify(payload)}\n\n`);
}

export function endModelStream(res: Response) {
  res.write(`event: model-stream-end\ndata: [DONE]\n\n`);
  res.end();
}

export function sendUsage(res: Response, modelId: string, usage: LanguageModelV2Usage) {
  res.write(`event: usage\ndata: ${JSON.stringify({ modelId, usage })}\n\n`);
}
