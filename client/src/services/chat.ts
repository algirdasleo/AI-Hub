import { apiFetch } from "@/lib/fetcher";
import { SSEHandler } from "@/lib/sse-handler";
import { ChatStreamParams, ChatJobResponse } from "@shared/types/chat";
import { Conversation } from "@shared/types/chat/conversation";
import { UIMessage } from "@shared/types/chat/message";

export const chatService = {
  async createChatJob(params: ChatStreamParams) {
    return apiFetch<ChatJobResponse>("/api/chat/job", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  streamChat(uid: string): SSEHandler {
    const streamUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat/stream?uid=${uid}`;
    return new SSEHandler(streamUrl);
  },

  async getConversations() {
    return apiFetch<Conversation[]>("/api/chat/conversations", {
      method: "GET",
    });
  },

  async getMessages(conversationId: string) {
    return apiFetch<UIMessage[]>(`/api/chat/conversations/${conversationId}/messages`, {
      method: "GET",
    });
  },
};
