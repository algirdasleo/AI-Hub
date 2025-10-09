import { Response } from "express";
import { LanguageModelV2Usage } from "@ai-sdk/provider";
import {
  ModelStreamErrorData,
  ModelStreamLatencyData,
  ModelStreamTextData,
  ModelStreamUsageData,
} from "@shared/types/comparison/model-stream-data.js";
import { EventType } from "@shared/types/core/event-types.js";

export function setupStreamHeaders(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
}

export function sendStreamComplete(res: Response) {
  res.write(`event: ${EventType.COMPLETE}\ndata: [DONE]\n\n`);
  res.end();
}

export function sendModelError(res: Response, payload: ModelStreamErrorData) {
  res.write(`event: ${EventType.ERROR}\ndata: ${JSON.stringify(payload)}\n\n`);
}

export function sendModelText(res: Response, payload: ModelStreamTextData) {
  res.write(`event: ${EventType.TEXT}\ndata: ${JSON.stringify(payload)}\n\n`);
}

export function sendLatencyMs(res: Response, payload: ModelStreamLatencyData) {
  res.write(`event: ${EventType.LATENCY_MS}\ndata: ${JSON.stringify(payload)}\n\n`);
}

export function sendUsage(res: Response, payload: ModelStreamUsageData) {
  res.write(`event: ${EventType.USAGE}\ndata: ${JSON.stringify(payload)}\n\n`);
}
