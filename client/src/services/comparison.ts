import { apiFetch } from "@/lib/fetcher";
import { SSEHandler } from "@/lib/sse-handler";
import { ComparisonStreamParams } from "@shared/types/comparison/comparison-request";
import {
  GetComparisonConversationsResponseDTO,
  GetComparisonPromptsResponseDTO,
} from "@shared/types/comparison/conversation";

export const comparisonService = {
  async createComparisonJob(params: ComparisonStreamParams) {
    return apiFetch<{ uid: string; conversationId?: string }>("/api/comparison/job", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  streamComparison(uid: string): SSEHandler {
    const streamUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/comparison/stream?uid=${uid}`;
    return new SSEHandler(streamUrl);
  },

  async getConversations() {
    return apiFetch<GetComparisonConversationsResponseDTO>("/api/comparison/conversations", {
      method: "GET",
    });
  },

  async getMessages(conversationId: string) {
    return apiFetch<GetComparisonPromptsResponseDTO>(`/api/comparison/conversations/${conversationId}/messages`, {
      method: "GET",
    });
  },
};
