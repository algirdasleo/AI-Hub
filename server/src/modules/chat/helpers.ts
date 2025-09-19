import { Response } from "express";
import { ErrorType } from "@shared/utils/error-type.js";
import { sendModelError, sendModelText, endModelStream } from "@server/lib/stream/helpers.js";
import { TextStreamPart, ToolSet } from "ai";

export function handleStreamPart(res: Response, part: TextStreamPart<ToolSet>) {
  switch (part.type) {
    case "error":
      sendModelError(res, { error: String(part.error), type: ErrorType.StreamError } as any);
      return false;
    case "abort":
      endModelStream(res);
      return false;
    case "tool-error":
      sendModelError(res, {
        modelId: "server",
        index: 0,
        error: String(part.error),
        errorType: ErrorType.StreamToolError,
      } as any);
      return false;
    case "text-delta":
      sendModelText(res, { modelId: "server", index: 0, text: part.text } as any);
      return true;
    default:
      return true;
  }
}
