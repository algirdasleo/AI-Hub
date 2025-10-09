import { ChatStreamParams } from "@shared/types/chat/index.js";

export type ChatJobPayloadResult = {
  conversationId: string;
};

export type ChatStreamExecutionParams = ChatStreamParams & {
  conversationId: string;
};
